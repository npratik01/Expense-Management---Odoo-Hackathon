import mongoose from "mongoose";
import bcrypt from "bcrypt";

const { Schema } = mongoose;

export const ROLES = Object.freeze({
  ADMIN: "admin",
  MANAGER: "manager",
  EMPLOYEE: "employee",
});

const userSchema = new Schema({
  name: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true,
  },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: Object.values(ROLES), default: ROLES.EMPLOYEE },
  company: { type: Schema.Types.ObjectId, ref: "Company", index: true },
  manager: { type: Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date },
});

userSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

userSchema.methods.setPassword = async function (password) {
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(password, salt);
};

userSchema.methods.validatePassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

export default mongoose.model("User", userSchema);
