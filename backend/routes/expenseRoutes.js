import { Router } from "express";
import multer from "multer";
import { auth, requireRole } from "../middleware/auth.js";
import {
  submitExpense,
  myExpenses,
  pendingApprovals,
  actOnExpense,
  getAllExpenses,
  getExpenseDetails,
} from "../controllers/expenseController.js";
import { ROLES } from "../models/User.js";

const upload = multer({ dest: "tmp_receipts/" });

const router = Router();
router.use(auth());
router.post(
  "/",
  requireRole(ROLES.EMPLOYEE, ROLES.MANAGER, ROLES.ADMIN),
  upload.single("receipt"),
  submitExpense
);
router.get(
  "/mine",
  requireRole(ROLES.EMPLOYEE, ROLES.MANAGER, ROLES.ADMIN),
  myExpenses
);
router.get(
  "/pending",
  requireRole(ROLES.MANAGER, ROLES.ADMIN),
  pendingApprovals
);
router.post(
  "/:id/action",
  requireRole(ROLES.MANAGER, ROLES.ADMIN),
  actOnExpense
);
router.get("/all", requireRole(ROLES.MANAGER, ROLES.ADMIN), getAllExpenses);
router.get("/:id", getExpenseDetails);

export default router;
