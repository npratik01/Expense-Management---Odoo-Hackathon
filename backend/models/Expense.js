import mongoose from "mongoose";
const { Schema } = mongoose;

export const EXPENSE_STATUS = Object.freeze({
  DRAFT: "draft",
  PENDING: "pending",
  PARTIALLY_APPROVED: "partially_approved",
  APPROVED: "approved",
  REJECTED: "rejected",
});

const approvalStepSchema = new Schema(
  {
    approver: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "skipped"],
      default: "pending",
    },
    actedAt: { type: Date },
    comment: { type: String },
  },
  { _id: false }
);

const expenseSchema = new Schema(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    baseAmount: { type: Number, required: true },
    baseCurrency: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String },
    date: { type: Date, required: true },
    receiptUrl: { type: String },
    status: {
      type: String,
      enum: Object.values(EXPENSE_STATUS),
      default: EXPENSE_STATUS.PENDING,
    },
    approvalSteps: [approvalStepSchema],
    currentStepIndex: { type: Number, default: 0 },
    history: [
      {
        at: { type: Date, default: Date.now },
        action: String,
        by: { type: Schema.Types.ObjectId, ref: "User" },
        meta: Schema.Types.Mixed,
      },
    ],
  },
  { timestamps: true }
);

expenseSchema.methods.recordHistory = function (action, by, meta) {
  this.history.push({ action, by, meta });
};

export default mongoose.model("Expense", expenseSchema);
