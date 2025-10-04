import mongoose from "mongoose";
const { Schema } = mongoose;

const companySchema = new Schema({
  name: { type: String, required: true },
  country: { type: String, required: true },
  currency: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  approvalRules: [{ type: Schema.Types.ObjectId, ref: "ApprovalRule" }],
});

companySchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model("Company", companySchema);
