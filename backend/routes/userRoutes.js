import { Router } from "express";
import {
  createUser,
  listUsers,
  updateUser,
  getUserDetails,
  deleteUser,
  getManagers,
} from "../controllers/userController.js";
import { auth, requireRole } from "../middleware/auth.js";
import { ROLES } from "../models/User.js";

const router = Router();
router.use(auth());

// User management routes (Admin only)
router.post("/", requireRole(ROLES.ADMIN), createUser);
router.get("/", requireRole(ROLES.ADMIN), listUsers);
router.get("/managers", getManagers); // Available to all authenticated users
router.get("/:id", getUserDetails);
router.put("/:id", requireRole(ROLES.ADMIN), updateUser);
router.delete("/:id", requireRole(ROLES.ADMIN), deleteUser);

export default router;
