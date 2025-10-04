import User, { ROLES } from "../models/User.js";
import Expense from "../models/Expense.js";

export async function createUser(req, res) {
  try {
    // Only admins can create users
    if (req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({ error: "Only admins can create users" });
    }

    const { name, email, password, role, managerId, department } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    // Validate role
    if (role && !Object.values(ROLES).includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // Check if email already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Validate manager if provided
    if (managerId) {
      const manager = await User.findById(managerId);
      if (
        !manager ||
        manager.company.toString() !== req.user.company._id.toString()
      ) {
        return res.status(400).json({ error: "Invalid manager" });
      }
      if (manager.role === ROLES.EMPLOYEE) {
        return res
          .status(400)
          .json({ error: "Manager must have manager or admin role" });
      }
    }

    const user = new User({
      name,
      email,
      role: role || ROLES.EMPLOYEE,
      company: req.user.company._id,
      manager: managerId || null,
      department,
      isBillApprover: req.body.isBillApprover || false,
      approvalLevel: req.body.approvalLevel || 0,
      approvalLimit: req.body.approvalLimit || 0,
      managersInSequence: req.body.managersInSequence || []
    });

    await user.setPassword(password || "ChangeMe123!");
    await user.save();

    const populatedUser = await User.findById(user._id)
      .populate("manager", "name email role")
      .select("-passwordHash");

    res.status(201).json(populatedUser);
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
}

export async function listUsers(req, res) {
  try {
    const users = await User.find({ company: req.user.company._id })
      .populate("manager", "name email role")
      .select("-passwordHash")
      .sort("name");

    res.json(users);
  } catch (error) {
    console.error("List users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
}

// Update user role and manager
export async function updateUser(req, res) {
  try {
    // Only admins can update users
    if (req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({ error: "Only admins can update users" });
    }

    const { id } = req.params;
    const { name, email, role, managerId, department } = req.body;

    const user = await User.findById(id);
    if (!user || user.company.toString() !== req.user.company._id.toString()) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prevent admin from changing their own role
    if (
      user._id.toString() === req.user._id.toString() &&
      role &&
      role !== req.user.role
    ) {
      return res.status(400).json({ error: "Cannot change your own role" });
    }

    // Validate role
    if (role && !Object.values(ROLES).includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // Validate manager if provided
    if (managerId) {
      const manager = await User.findById(managerId);
      if (
        !manager ||
        manager.company.toString() !== req.user.company._id.toString()
      ) {
        return res.status(400).json({ error: "Invalid manager" });
      }
      if (manager.role === ROLES.EMPLOYEE) {
        return res
          .status(400)
          .json({ error: "Manager must have manager or admin role" });
      }
      // Prevent circular manager relationships
      if (managerId === id) {
        return res
          .status(400)
          .json({ error: "User cannot be their own manager" });
      }
    }

    // Check for email conflicts if email is being changed
    if (email && email !== user.email) {
      const existing = await User.findOne({ email, _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({ error: "Email already exists" });
      }
    }

    // Update user fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (department !== undefined) user.department = department;
    if (req.body.isBillApprover !== undefined) user.isBillApprover = req.body.isBillApprover;
    if (req.body.approvalLevel !== undefined) user.approvalLevel = req.body.approvalLevel;
    if (req.body.approvalLimit !== undefined) user.approvalLimit = req.body.approvalLimit;
    if (req.body.managersInSequence !== undefined) user.managersInSequence = req.body.managersInSequence;

    // Handle manager assignment
    if (managerId === null || managerId === "") {
      user.manager = null;
    } else if (managerId) {
      user.manager = managerId;
    }

    await user.save();

    const updatedUser = await User.findById(user._id)
      .populate("manager", "name email role")
      .select("-passwordHash");

    res.json(updatedUser);
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
}

// Get user details
export async function getUserDetails(req, res) {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .populate("manager", "name email role")
      .select("-passwordHash");

    if (!user || user.company.toString() !== req.user.company._id.toString()) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get user's team members if they're a manager
    let teamMembers = [];
    if (user.role === ROLES.MANAGER || user.role === ROLES.ADMIN) {
      teamMembers = await User.find({ manager: user._id })
        .select("name email role")
        .sort("name");
    }

    res.json({
      ...user.toObject(),
      teamMembers,
    });
  } catch (error) {
    console.error("Get user details error:", error);
    res.status(500).json({ error: "Failed to fetch user details" });
  }
}

// Delete user
export async function deleteUser(req, res) {
  try {
    // Only admins can delete users
    if (req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({ error: "Only admins can delete users" });
    }

    const { id } = req.params;

    const user = await User.findById(id);
    if (!user || user.company.toString() !== req.user.company._id.toString()) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    // Check if user has team members
    const teamMembers = await User.find({ manager: user._id });
    if (teamMembers.length > 0) {
      return res.status(400).json({
        error:
          "Cannot delete user who is managing other employees. Reassign team members first.",
      });
    }

    // Check if user has pending expenses
    const pendingExpenses = await Expense.find({
      employee: user._id,
      status: { $in: ["pending", "partially_approved"] },
    });

    if (pendingExpenses.length > 0) {
      return res.status(400).json({
        error:
          "Cannot delete user with pending expenses. Resolve expenses first.",
      });
    }

    await User.findByIdAndDelete(id);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
}

// Get managers list for dropdown
export async function getManagers(req, res) {
  try {
    const managers = await User.find({
      company: req.user.company._id,
      role: { $in: [ROLES.MANAGER, ROLES.ADMIN] },
    })
      .select("name email role")
      .sort("name");

    res.json(managers);
  } catch (error) {
    console.error("Get managers error:", error);
    res.status(500).json({ error: "Failed to fetch managers" });
  }
}

// Get role statistics
export async function getRoleStatistics(req, res) {
  try {
    const pipeline = [
      { $match: { company: req.user.company._id } },
      { $group: { _id: "$role", count: { $sum: 1 } } },
      { $project: { role: "$_id", count: 1, _id: 0 } }
    ];
    
    const stats = await User.aggregate(pipeline);
    
    // Ensure all roles are represented
    const roleStats = {
      admin: 0,
      manager: 0,
      employee: 0
    };
    
    stats.forEach(stat => {
      roleStats[stat.role] = stat.count;
    });
    
    res.json(roleStats);
  } catch (error) {
    console.error("Get role statistics error:", error);
    res.status(500).json({ error: "Failed to fetch role statistics" });
  }
}

// Get approval workflow statistics
export async function getApprovalStats(req, res) {
  try {
    const billApprovers = await User.countDocuments({
      company: req.user.company._id,
      isBillApprover: true
    });
    
    const usersWithApprovalLevels = await User.find({
      company: req.user.company._id,
      approvalLevel: { $gt: 0 }
    }).select("name approvalLevel approvalLimit isBillApprover");
    
    const sequentialApprovals = await User.countDocuments({
      company: req.user.company._id,
      "managersInSequence.0": { $exists: true }
    });
    
    res.json({
      billApprovers,
      usersWithApprovalLevels,
      sequentialApprovals
    });
  } catch (error) {
    console.error("Get approval stats error:", error);
    res.status(500).json({ error: "Failed to fetch approval statistics" });
  }
}

// Bulk update user roles
export async function bulkUpdateRoles(req, res) {
  try {
    if (req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({ error: "Only admins can bulk update roles" });
    }
    
    const { userUpdates } = req.body; // Array of { userId, role }
    
    const bulkOps = userUpdates.map(update => ({
      updateOne: {
        filter: { 
          _id: update.userId, 
          company: req.user.company._id,
          _id: { $ne: req.user._id } // Prevent self-update
        },
        update: { role: update.role }
      }
    }));
    
    const result = await User.bulkWrite(bulkOps);
    
    res.json({
      message: "Roles updated successfully",
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error("Bulk update roles error:", error);
    res.status(500).json({ error: "Failed to update roles" });
  }
}

// Get user hierarchy
export async function getUserHierarchy(req, res) {
  try {
    const users = await User.find({ company: req.user.company._id })
      .populate("manager", "name email role")
      .select("name email role manager isBillApprover approvalLevel")
      .sort("name");
    
    // Build hierarchy tree
    const userMap = new Map();
    const hierarchy = [];
    
    users.forEach(user => {
      userMap.set(user._id.toString(), { 
        ...user.toObject(), 
        children: [] 
      });
    });
    
    users.forEach(user => {
      if (user.manager) {
        const parent = userMap.get(user.manager._id.toString());
        if (parent) {
          parent.children.push(userMap.get(user._id.toString()));
        }
      } else {
        hierarchy.push(userMap.get(user._id.toString()));
      }
    });
    
    res.json(hierarchy);
  } catch (error) {
    console.error("Get user hierarchy error:", error);
    res.status(500).json({ error: "Failed to fetch user hierarchy" });
  }
}
