import { Router } from "express";
import {
  createUser,
  listUsers,
  updateUser,
  getUserDetails,
  deleteUser,
  getManagers,
  getRoleStatistics,
  getApprovalStats,
  bulkUpdateRoles,
  getUserHierarchy,
} from "../controllers/userController.js";
import { auth, requireRole } from "../middleware/auth.js";
import { ROLES } from "../models/User.js";

const router = Router();
router.use(auth());

// User management routes (Admin only)
router.post("/", requireRole(ROLES.ADMIN), createUser);
router.get("/", requireRole(ROLES.ADMIN), listUsers);
router.get("/managers", getManagers); // Available to all authenticated users
router.get("/stats/roles", requireRole(ROLES.ADMIN), getRoleStatistics);
router.get("/stats/approvals", requireRole(ROLES.ADMIN), getApprovalStats);
router.get("/hierarchy", requireRole(ROLES.ADMIN), getUserHierarchy);
router.put("/bulk-roles", requireRole(ROLES.ADMIN), bulkUpdateRoles);
router.get("/:id", getUserDetails);
router.put("/:id", requireRole(ROLES.ADMIN), updateUser);
router.delete("/:id", requireRole(ROLES.ADMIN), deleteUser);

export default router;
