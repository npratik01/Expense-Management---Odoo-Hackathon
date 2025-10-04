import jwt from "jsonwebtoken";
import User from "../models/User.js";

export function auth(required = true) {
  return async function (req, res, next) {
    const header = req.headers.authorization;
    if (!header) {
      if (required)
        return res.status(401).json({ error: "Missing Authorization header" });
      return next();
    }
    const token = header.replace("Bearer ", "");
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(payload.sub).populate("company");
      if (!req.user)
        return res.status(401).json({ error: "Invalid token user" });
      next();
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }
  };
}

export function requireRole(...roles) {
  return function (req, res, next) {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (!roles.includes(req.user.role))
      return res.status(403).json({ error: "Forbidden" });
    next();
  };
}
