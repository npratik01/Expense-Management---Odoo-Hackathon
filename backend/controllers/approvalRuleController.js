import ApprovalRule from "../models/ApprovalRule.js";
import User from "../models/User.js";

export async function createRule(req, res) {
  try {
    const { name, description, approvalSteps, conditions, priority } = req.body;

    // Validate approval steps
    if (
      !approvalSteps ||
      !Array.isArray(approvalSteps) ||
      approvalSteps.length === 0
    ) {
      return res
        .status(400)
        .json({ error: "At least one approval step is required" });
    }

    // Validate each approval step
    for (const step of approvalSteps) {
      if (!step.name || !step.sequence) {
        return res
          .status(400)
          .json({ error: "Each step must have a name and sequence" });
      }

      // Validate specific approvers exist
      if (step.specificApprovers && step.specificApprovers.length > 0) {
        const approvers = await User.find({
          _id: { $in: step.specificApprovers },
          company: req.user.company._id,
        });
        if (approvers.length !== step.specificApprovers.length) {
          return res
            .status(400)
            .json({ error: "One or more specified approvers not found" });
        }
      }
    }

    // Sort steps by sequence
    approvalSteps.sort((a, b) => a.sequence - b.sequence);

    const rule = new ApprovalRule({
      company: req.user.company._id,
      name,
      description,
      approvalSteps,
      conditions: conditions || {},
      priority: priority || 0,
    });

    await rule.save();

    const populatedRule = await ApprovalRule.findById(rule._id).populate(
      "approvalSteps.specificApprovers",
      "name email role"
    );

    res.status(201).json(populatedRule);
  } catch (error) {
    console.error("Create approval rule error:", error);
    res.status(500).json({ error: "Failed to create approval rule" });
  }
}

export async function listRules(req, res) {
  try {
    const rules = await ApprovalRule.find({
      company: req.user.company._id,
    })
      .populate("approvalSteps.specificApprovers", "name email role")
      .sort({ priority: -1, createdAt: -1 });

    res.json(rules);
  } catch (error) {
    console.error("List approval rules error:", error);
    res.status(500).json({ error: "Failed to fetch approval rules" });
  }
}

export async function updateRule(req, res) {
  try {
    const { id } = req.params;
    const { name, description, approvalSteps, conditions, priority, isActive } =
      req.body;

    const rule = await ApprovalRule.findById(id);
    if (!rule || rule.company.toString() !== req.user.company._id.toString()) {
      return res.status(404).json({ error: "Approval rule not found" });
    }

    // Validate approval steps if provided
    if (approvalSteps) {
      if (!Array.isArray(approvalSteps) || approvalSteps.length === 0) {
        return res
          .status(400)
          .json({ error: "At least one approval step is required" });
      }

      // Validate each approval step
      for (const step of approvalSteps) {
        if (!step.name || !step.sequence) {
          return res
            .status(400)
            .json({ error: "Each step must have a name and sequence" });
        }

        // Validate specific approvers exist
        if (step.specificApprovers && step.specificApprovers.length > 0) {
          const approvers = await User.find({
            _id: { $in: step.specificApprovers },
            company: req.user.company._id,
          });
          if (approvers.length !== step.specificApprovers.length) {
            return res
              .status(400)
              .json({ error: "One or more specified approvers not found" });
          }
        }
      }

      // Sort steps by sequence
      approvalSteps.sort((a, b) => a.sequence - b.sequence);
      rule.approvalSteps = approvalSteps;
    }

    // Update other fields
    if (name) rule.name = name;
    if (description !== undefined) rule.description = description;
    if (conditions !== undefined) rule.conditions = conditions;
    if (priority !== undefined) rule.priority = priority;
    if (isActive !== undefined) rule.isActive = isActive;

    await rule.save();

    const populatedRule = await ApprovalRule.findById(rule._id).populate(
      "approvalSteps.specificApprovers",
      "name email role"
    );

    res.json(populatedRule);
  } catch (error) {
    console.error("Update approval rule error:", error);
    res.status(500).json({ error: "Failed to update approval rule" });
  }
}

export async function deleteRule(req, res) {
  try {
    const { id } = req.params;

    const rule = await ApprovalRule.findById(id);
    if (!rule || rule.company.toString() !== req.user.company._id.toString()) {
      return res.status(404).json({ error: "Approval rule not found" });
    }

    await ApprovalRule.findByIdAndDelete(id);
    res.json({ message: "Approval rule deleted successfully" });
  } catch (error) {
    console.error("Delete approval rule error:", error);
    res.status(500).json({ error: "Failed to delete approval rule" });
  }
}

export async function getRuleDetails(req, res) {
  try {
    const { id } = req.params;

    const rule = await ApprovalRule.findById(id).populate(
      "approvalSteps.specificApprovers",
      "name email role"
    );

    if (!rule || rule.company.toString() !== req.user.company._id.toString()) {
      return res.status(404).json({ error: "Approval rule not found" });
    }

    res.json(rule);
  } catch (error) {
    console.error("Get approval rule details error:", error);
    res.status(500).json({ error: "Failed to fetch approval rule details" });
  }
}
