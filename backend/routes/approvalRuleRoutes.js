import { Router } from "express";
import {
  createRule,
  listRules,
  updateRule,
  deleteRule,
  getRuleDetails,
} from "../controllers/approvalRuleController.js";
import { auth, requireRole } from "../middleware/auth.js";
import { ROLES } from "../models/User.js";

const router = Router();
router.use(auth());
router.post("/", requireRole(ROLES.ADMIN), createRule);
router.get("/", requireRole(ROLES.ADMIN), listRules);
router.get("/:id", requireRole(ROLES.ADMIN), getRuleDetails);
router.put("/:id", requireRole(ROLES.ADMIN), updateRule);
router.delete("/:id", requireRole(ROLES.ADMIN), deleteRule);
export default router;
