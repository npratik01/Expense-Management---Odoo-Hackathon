import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import User from "./models/User.js";
import Company from "./models/Company.js";

// Load environment variables
dotenv.config();

const DEFAULT_USERS = [
  {
    name: "Admin User",
    email: "admin@company.com",
    password: "Admin123!",
    role: "admin",
    department: "Administration",
    isBillApprover: true,
    approvalLevel: 10,
    approvalLimit: 100000,
    managersInSequence: []
  },
  {
    name: "Finance Manager",
    email: "finance.manager@company.com",
    password: "Manager123!",
    role: "manager",
    department: "Finance",
    isBillApprover: true,
    approvalLevel: 5,
    approvalLimit: 50000,
    managersInSequence: []
  },
  {
    name: "HR Manager",
    email: "hr.manager@company.com",
    password: "Manager123!",
    role: "manager",
    department: "Human Resources",
    isBillApprover: true,
    approvalLevel: 3,
    approvalLimit: 25000,
    managersInSequence: []
  },
  {
    name: "John Employee",
    email: "john@company.com",
    password: "Employee123!",
    role: "employee",
    department: "Engineering",
    isBillApprover: false,
    approvalLevel: 0,
    approvalLimit: 0,
    managersInSequence: []
  },
  {
    name: "Sarah Employee",
    email: "sarah@company.com",
    password: "Employee123!",
    role: "employee",
    department: "Marketing",
    isBillApprover: false,
    approvalLevel: 0,
    approvalLimit: 0,
    managersInSequence: []
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB using the same URI as the server
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB Atlas");

    // Clear existing data
    await User.deleteMany({});
    await Company.deleteMany({});
    console.log("🗑️ Cleared existing data");

    // Create default company
    const company = new Company({
      name: "Default Company",
      address: "123 Business Street, City, State 12345",
      phone: "+1-234-567-8900",
      email: "info@company.com",
      country: "United States",
      currency: "USD"
    });
    await company.save();
    console.log("🏢 Created default company");

    // Create users with proper password hashing
    const users = [];
    for (const userData of DEFAULT_USERS) {
      const user = new User({
        name: userData.name,
        email: userData.email,
        role: userData.role,
        company: company._id,
        department: userData.department,
        isBillApprover: userData.isBillApprover,
        approvalLevel: userData.approvalLevel,
        approvalLimit: userData.approvalLimit,
        managersInSequence: userData.managersInSequence
      });
      
      // Use the User model's setPassword method
      await user.setPassword(userData.password);
      await user.save();
      users.push(user);
      console.log(`👤 Created user: ${userData.name} (${userData.role}) - ${userData.email}`);
    }

    // Set up manager relationships
    const financeManager = users.find(u => u.name === "Finance Manager");
    const hrManager = users.find(u => u.name === "HR Manager");
    const johnEmployee = users.find(u => u.name === "John Employee");
    const sarahEmployee = users.find(u => u.name === "Sarah Employee");

    // Assign managers to employees
    johnEmployee.manager = financeManager._id;
    johnEmployee.managersInSequence = [financeManager._id];
    await johnEmployee.save();

    sarahEmployee.manager = hrManager._id;
    sarahEmployee.managersInSequence = [hrManager._id];
    await sarahEmployee.save();

    console.log("Set up manager relationships");

    console.log("Database seeded successfully!");
    console.log("\nDefault login credentials:");
    console.log("Admin: admin@company.com / Admin123!");
    console.log("Finance Manager: finance.manager@company.com / Manager123!");
    console.log("HR Manager: hr.manager@company.com / Manager123!");
    console.log("Employee: john@company.com / Employee123!");
    console.log("Employee: sarah@company.com / Employee123!");

  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run seeder if called directly
console.log("🚀 Starting seeder...");
seedDatabase().then(() => {
  console.log("✅ Seeder completed successfully");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Seeder failed:", error);
  process.exit(1);
});

export default seedDatabase;