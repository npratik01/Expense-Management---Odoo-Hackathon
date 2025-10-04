import mongoose from "mongoose";
const { Schema } = mongoose;

// Sequential approval workflow schema
const approvalStepSchema = new Schema(
  {
    name: { type: String, required: true }, // e.g., "Manager", "Finance", "Director"
    sequence: { type: Number, required: true }, // 1, 2, 3...
    isManagerApprover: { type: Boolean, default: false }, // If true, use employee's manager
    specificApprovers: [{ type: Schema.Types.ObjectId, ref: "User" }], // Specific users
    roleBasedApprovers: [
      { type: String, enum: ["admin", "manager", "employee"] },
    ], // Role-based
    percentageThreshold: { type: Number, default: 100 }, // % of approvers needed in this step
    isRequired: { type: Boolean, default: true },
    skipIfPreviousRejected: { type: Boolean, default: true },
  },
  { _id: false }
);

const approvalRuleSchema = new Schema(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    description: { type: String },
    approvalSteps: [approvalStepSchema], // Sequential approval steps
    conditions: {
      minAmount: { type: Number },
      maxAmount: { type: Number },
      category: { type: String },
      department: { type: String },
      employeeRoles: [{ type: String, enum: ["admin", "manager", "employee"] }],
    },
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 0 }, // Higher priority rules are applied first
  },
  { timestamps: true }
);

// Method to determine if this rule applies to an expense
approvalRuleSchema.methods.appliesTo = function (expense, employee) {
  const conditions = this.conditions;

  // Check amount conditions
  if (conditions.minAmount && expense.amount < conditions.minAmount)
    return false;
  if (conditions.maxAmount && expense.amount > conditions.maxAmount)
    return false;

  // Check category condition
  if (conditions.category && expense.category !== conditions.category)
    return false;

  // Check employee role condition
  if (conditions.employeeRoles && conditions.employeeRoles.length > 0) {
    if (!conditions.employeeRoles.includes(employee.role)) return false;
  }

  return true;
};

export default mongoose.model("ApprovalRule", approvalRuleSchema);
