import User, { ROLES } from "../models/User.js";
import Company from "../models/Company.js";
import jwt from "jsonwebtoken";
import axios from "axios";

function sign(user) {
  return jwt.sign({ sub: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "8h",
  });
}

export async function signup(req, res) {
  const { name, email, password, country, companyName } = req.body;
  const existing = await User.findOne({ email });
  if (existing)
    return res.status(400).json({ error: "Email already registered" });

  // fetch country currency
  const { data: countries } = await axios.get(
    `https://restcountries.com/v3.1/name/${encodeURIComponent(
      country
    )}?fields=currencies,name`
  );
  if (!countries.length)
    return res.status(400).json({ error: "Invalid country" });
  const countryData = countries[0];
  const currency = Object.keys(countryData.currencies || {})[0] || "USD";

  // create company
  const company = new Company({
    name: companyName || `${name}'s Company`,
    country,
    currency,
  });
  await company.save();

  const user = new User({
    name,
    email,
    role: ROLES.ADMIN,
    company,
    passwordHash: "temp",
  });
  await user.setPassword(password);
  await user.save();

  const token = sign(user);
  res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    company,
  });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).populate("company");
  if (!user) return res.status(400).json({ error: "Invalid credentials" });
  const ok = await user.validatePassword(password);
  if (!ok) return res.status(400).json({ error: "Invalid credentials" });
  user.lastLoginAt = new Date();
  await user.save();
  const token = sign(user);
  res.json({
    token,
    user: { id: user._id, name: user.name, role: user.role },
    company: user.company,
  });
}
