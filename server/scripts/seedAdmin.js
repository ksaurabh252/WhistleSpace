const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin.model");
require("dotenv").config();

/**
 * Creates a default admin user in the database if none exists
 * This script is typically run during initial system setup
 *
 * Environment Variables Required:
 * - MONGO_URI: MongoDB connection string
 * - DEFAULT_ADMIN_EMAIL: Email for default admin (optional)
 * - DEFAULT_ADMIN_PASSWORD: Password for default admin (optional)
 */
async function createDefaultAdmin() {
  try {
    // Establish database connection
    await mongoose.connect(process.env.MONGO_URI);
    console.log("📦 Connected to MongoDB for seeding...");

    // Check for existing admin to prevent duplicate creation
    const existingAdmin = await Admin.findOne({});
    if (existingAdmin) {
      console.log("✅ Default admin already exists:", existingAdmin.email);
      await mongoose.disconnect();
      return;
    }

    // Set up default admin credentials
    // Falls back to hardcoded values if environment variables aren't set
    const defaultAdminEmail =
      process.env.DEFAULT_ADMIN_EMAIL || "admin@whistlespace.com";
    const defaultAdminPassword =
      process.env.DEFAULT_ADMIN_PASSWORD || "Admin123!";

    // Hash password for security
    const hashedPassword = await bcrypt.hash(defaultAdminPassword, 10);

    // Create new admin document with default values
    const defaultAdmin = await Admin.create({
      email: defaultAdminEmail,
      password: hashedPassword,
      name: "Default Admin",
      isGoogleAuth: false,
      isDefaultAdmin: true, // Flag to identify system-created admin
    });

    // Log success information
    console.log("✅ Default admin created successfully!");
    console.log("📧 Email:", defaultAdminEmail);
    console.log("🔑 Password:", defaultAdminPassword);
    console.log("⚠️  Please change the default password after first login!");

    // Clean up database connection
    await mongoose.disconnect();
    console.log("📦 Database connection closed.");
  } catch (error) {
    // Error handling
    console.error("❌ Error creating default admin:", error);
    await mongoose.disconnect();
    process.exit(1); // Exit with error code
  }
}

/**
 * Script execution logic
 * Allows file to be run directly or imported as a module
 *
 * Usage:
 * - Direct execution: node createDefaultAdmin.js
 * - Module import: const createDefaultAdmin = require('./createDefaultAdmin');
 */
if (require.main === module) {
  createDefaultAdmin();
}

module.exports = createDefaultAdmin;
