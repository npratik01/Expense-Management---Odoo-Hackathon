import Expense, { EXPENSE_STATUS } from "../models/Expense.js";
import ApprovalRule from "../models/ApprovalRule.js";
import User from "../models/User.js";
import { convert } from "../utils/currency.js";
import { extractReceiptData } from "../utils/ocr.js";
import fs from "fs";
import mongoose from "mongoose";

// Helper function to generate approval steps based on rules
async function generateApprovalSteps(expense, employee, company) {
  const rules = await ApprovalRule.find({
    company: company._id,
    isActive: true,
  }).sort({ priority: -1 }); // Higher priority first

  // Find the first matching rule
  const matchingRule = rules.find((rule) => rule.appliesTo(expense, employee));

  if (!matchingRule || !matchingRule.approvalSteps.length) {
    // Default: require manager approval if employee has a manager
    if (employee.manager) {
      return [
        {
          approver: employee.manager,
          status: "pending",
          stepName: "Manager Approval",
          sequence: 1,
        },
      ];
    }
    return []; // No approval needed
  }

  const approvalSteps = [];

  for (const ruleStep of matchingRule.approvalSteps.sort(
    (a, b) => a.sequence - b.sequence
  )) {
    let stepApprovers = [];

    // Manager approver
    if (ruleStep.isManagerApprover && employee.manager) {
      stepApprovers.push(employee.manager);
    }

    // Specific approvers
    if (ruleStep.specificApprovers && ruleStep.specificApprovers.length > 0) {
      stepApprovers.push(...ruleStep.specificApprovers);
    }

    // Role-based approvers
    if (ruleStep.roleBasedApprovers && ruleStep.roleBasedApprovers.length > 0) {
      const roleUsers = await User.find({
        company: company._id,
        role: { $in: ruleStep.roleBasedApprovers },
      });
      stepApprovers.push(...roleUsers.map((u) => u._id));
    }

    // Remove duplicates and employee themselves
    stepApprovers = [...new Set(stepApprovers.map(String))]
      .filter((id) => String(id) !== String(employee._id))
      .map((id) => new mongoose.Types.ObjectId(id));

    // Create approval steps for each approver in this step
    if (stepApprovers.length > 0) {
      for (const approver of stepApprovers) {
        approvalSteps.push({
          approver,
          status: "pending",
          stepName: ruleStep.name,
          sequence: ruleStep.sequence,
          percentageThreshold: ruleStep.percentageThreshold,
          isRequired: ruleStep.isRequired,
        });
      }
    }
  }

  return approvalSteps;
}

export async function submitExpense(req, res) {
  try {
    const { amount, currency, category, description, date } = req.body;
    const receiptFile = req.file;
    let ocrData;

    // Process OCR if receipt file is provided
    if (receiptFile) {
      try {
        ocrData = await extractReceiptData(receiptFile.path);
      } catch (err) {
        console.error("OCR processing failed:", err);
      }
    }

    const company = req.user.company;
    const employee = await User.findById(req.user._id).populate("manager");

    // Convert to company base currency
    const baseAmount = await convert(
      Number(amount),
      currency,
      company.currency
    ).catch(() => Number(amount));

    // Create expense object for rule evaluation
    const expenseData = {
      amount: Number(amount),
      baseAmount,
      currency,
      category,
      employee: req.user._id,
      company: company._id,
    };

    // Generate approval steps
    const approvalSteps = await generateApprovalSteps(
      expenseData,
      employee,
      company
    );

    // Create the expense
    const expense = new Expense({
      employee: req.user._id,
      company: company._id,
      amount: Number(amount),
      currency,
      baseAmount,
      baseCurrency: company.currency,
      category,
      description: description || ocrData?.rawText?.slice(0, 140) || "",
      date: date ? new Date(date) : ocrData?.date || new Date(),
      receiptUrl: receiptFile ? `/uploads/${receiptFile.filename}` : undefined,
      approvalSteps,
      status:
        approvalSteps.length > 0
          ? EXPENSE_STATUS.PENDING
          : EXPENSE_STATUS.APPROVED,
      currentStepIndex: 0,
    });

    expense.recordHistory("submitted", req.user._id, {
      originalAmount: `${amount} ${currency}`,
      category,
    });

    await expense.save();

    // Clean up uploaded file
    if (receiptFile) {
      fs.unlink(receiptFile.path, () => {});
    }

    res.status(201).json({
      id: expense._id,
      status: expense.status,
      approvalSteps: expense.approvalSteps.length,
    });
  } catch (error) {
    console.error("Submit expense error:", error);
    res.status(500).json({ error: "Failed to submit expense" });
  }
}

export async function myExpenses(req, res) {
  try {
    const expenses = await Expense.find({ employee: req.user._id })
      .populate("approvalSteps.approver", "name email role")
      .sort("-createdAt");

    res.json(expenses);
  } catch (error) {
    console.error("Get my expenses error:", error);
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
}

export async function pendingApprovals(req, res) {
  try {
    // Find expenses where current user is an approver in pending state
    const expenses = await Expense.find({
      status: {
        $in: [EXPENSE_STATUS.PENDING, EXPENSE_STATUS.PARTIALLY_APPROVED],
      },
      "approvalSteps.approver": req.user._id,
    })
      .populate("employee", "name email")
      .populate("approvalSteps.approver", "name email role")
      .sort("-createdAt");

    // Filter to only show expenses where it's the user's turn to approve
    const pendingForUser = expenses.filter((expense) => {
      const currentSteps = expense.approvalSteps.filter(
        (step) => step.sequence === getCurrentSequence(expense)
      );

      return currentSteps.some(
        (step) =>
          String(step.approver._id) === String(req.user._id) &&
          step.status === "pending"
      );
    });

    res.json(pendingForUser);
  } catch (error) {
    console.error("Get pending approvals error:", error);
    res.status(500).json({ error: "Failed to fetch pending approvals" });
  }
}

// Helper function to get current sequence number
function getCurrentSequence(expense) {
  const approvedSequences = new Set();
  const pendingSequences = new Set();

  for (const step of expense.approvalSteps) {
    if (step.status === "approved") {
      approvedSequences.add(step.sequence);
    } else if (step.status === "pending") {
      pendingSequences.add(step.sequence);
    }
  }

  // Find the lowest pending sequence
  const sortedPendingSequences = Array.from(pendingSequences).sort(
    (a, b) => a - b
  );
  return sortedPendingSequences[0] || 1;
}

// Helper function to check if a sequence is complete
function isSequenceComplete(expense, sequence) {
  const stepsInSequence = expense.approvalSteps.filter(
    (step) => step.sequence === sequence
  );
  const approvedSteps = stepsInSequence.filter(
    (step) => step.status === "approved"
  );

  if (stepsInSequence.length === 0) return true;

  // Check if percentage threshold is met
  const percentageThreshold = stepsInSequence[0]?.percentageThreshold || 100;
  const approvalPercentage =
    (approvedSteps.length / stepsInSequence.length) * 100;

  return approvalPercentage >= percentageThreshold;
}

export async function actOnExpense(req, res) {
  try {
    const { id } = req.params;
    const { action, comment } = req.body; // action: approve|reject

    const expense = await Expense.findById(id)
      .populate("employee", "name email")
      .populate("approvalSteps.approver", "name email role");

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    // Find the current user's pending approval step
    const currentSequence = getCurrentSequence(expense);
    const userStep = expense.approvalSteps.find(
      (step) =>
        String(step.approver._id) === String(req.user._id) &&
        step.sequence === currentSequence &&
        step.status === "pending"
    );

    if (!userStep) {
      return res
        .status(403)
        .json({ error: "Not authorized to act on this expense" });
    }

    // Process the action
    if (action === "approve") {
      userStep.status = "approved";
      userStep.actedAt = new Date();
      userStep.comment = comment || "";

      expense.recordHistory("step_approved", req.user._id, {
        comment,
        stepName: userStep.stepName,
        sequence: userStep.sequence,
      });

      // Check if current sequence is complete
      if (isSequenceComplete(expense, currentSequence)) {
        // Move to next sequence or complete approval
        const nextSequence = Math.min(
          ...expense.approvalSteps
            .filter((step) => step.sequence > currentSequence)
            .map((step) => step.sequence)
        );

        if (nextSequence === Infinity) {
          // No more sequences, expense is fully approved
          expense.status = EXPENSE_STATUS.APPROVED;
          expense.recordHistory("fully_approved", req.user._id, { comment });
        } else {
          // Move to next sequence
          expense.status = EXPENSE_STATUS.PARTIALLY_APPROVED;
          expense.recordHistory("sequence_completed", req.user._id, {
            completedSequence: currentSequence,
            nextSequence,
          });
        }
      } else {
        // Still waiting for more approvals in current sequence
        expense.status = EXPENSE_STATUS.PARTIALLY_APPROVED;
      }
    } else if (action === "reject") {
      userStep.status = "rejected";
      userStep.actedAt = new Date();
      userStep.comment = comment || "";

      expense.status = EXPENSE_STATUS.REJECTED;
      expense.recordHistory("rejected", req.user._id, {
        comment,
        stepName: userStep.stepName,
        sequence: userStep.sequence,
      });
    } else {
      return res
        .status(400)
        .json({ error: 'Invalid action. Use "approve" or "reject"' });
    }

    await expense.save();

    res.json({
      status: expense.status,
      message: `Expense ${action}ed successfully`,
      expense: {
        id: expense._id,
        status: expense.status,
        employee: expense.employee.name,
        amount: expense.amount,
        currency: expense.currency,
      },
    });
  } catch (error) {
    console.error("Act on expense error:", error);
    res.status(500).json({ error: "Failed to process approval action" });
  }
}

// Get all expenses for admin/manager view
export async function getAllExpenses(req, res) {
  try {
    const query = { company: req.user.company._id };

    // Add filters based on user role
    if (req.user.role === "manager") {
      // Managers can see their own expenses and their team's expenses
      const teamMembers = await User.find({ manager: req.user._id });
      const teamIds = teamMembers.map((member) => member._id);
      query.employee = { $in: [...teamIds, req.user._id] };
    }
    // Admins can see all expenses (no additional filter needed)

    const expenses = await Expense.find(query)
      .populate("employee", "name email role")
      .populate("approvalSteps.approver", "name email role")
      .sort("-createdAt");

    res.json(expenses);
  } catch (error) {
    console.error("Get all expenses error:", error);
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
}

// Get expense details
export async function getExpenseDetails(req, res) {
  try {
    const { id } = req.params;
    const expense = await Expense.findById(id)
      .populate("employee", "name email role")
      .populate("approvalSteps.approver", "name email role")
      .populate("history.by", "name email role");

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    // Check if user has permission to view this expense
    const canView =
      expense.employee._id.toString() === req.user._id.toString() ||
      req.user.role === "admin" ||
      (req.user.role === "manager" &&
        expense.approvalSteps.some(
          (step) => step.approver._id.toString() === req.user._id.toString()
        ));

    if (!canView) {
      return res
        .status(403)
        .json({ error: "Not authorized to view this expense" });
    }

    res.json(expense);
  } catch (error) {
    console.error("Get expense details error:", error);
    res.status(500).json({ error: "Failed to fetch expense details" });
  }
}
