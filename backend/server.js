import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB connection error:", err));

// Simple Route
app.get("/", (req, res) => {
  res.send("Hello from MERN backend!");
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

import User from "./models/User.js";

app.post("/add-user", async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.json({ message: "User added successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
