const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin.model");
require("dotenv").config();

/**
 * Seeds the database with a default admin account (only if none exists).
 *
 * Required ENV:
 *   - MONGO_URI                MongoDB connection string
 * Optional ENV:
 *   - DEFAULT_ADMIN_EMAIL      Default admin email
 *   - DEFAULT_ADMIN_PASSWORD   Default admin password
 *   - DEFAULT_ADMIN_NAME       Default admin display name
 */
async function createDefaultAdmin() {
  try {
    console.log("🔄 Starting default admin creation…");

    // ────────────────────────────────────────────────────────────────
    // 1. Connect to MongoDB (only if not already connected)
    // ────────────────────────────────────────────────────────────────
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
      console.log("📦 Connected to MongoDB");
    }

    // ────────────────────────────────────────────────────────────────
    // 2. Abort if any admin already exists
    // ────────────────────────────────────────────────────────────────
    const existingAdmin = await Admin.findOne({});
    if (existingAdmin) {
      console.log("✅ Admin already exists:");
      console.log("📧 Email:", existingAdmin.email);
      console.log("👤 Name:", existingAdmin.name || "Not set");
      console.log(
        "🔑 Default Admin:",
        existingAdmin.isDefaultAdmin ? "Yes" : "No"
      );
      return;
    }

    // ────────────────────────────────────────────────────────────────
    // 3. Gather credentials (env ⟶ fallback defaults)
    // ────────────────────────────────────────────────────────────────
    const adminEmail =
      process.env.DEFAULT_ADMIN_EMAIL || "admin@whistlespace.com";
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "Admin123!";
    const adminName = process.env.DEFAULT_ADMIN_NAME || "WhistleSpace Admin";

    console.log("🔄 Creating default admin…");

    // ────────────────────────────────────────────────────────────────
    // 4. Securely hash the password
    // ────────────────────────────────────────────────────────────────
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    // ────────────────────────────────────────────────────────────────
    // 5. Create the admin user
    // ────────────────────────────────────────────────────────────────
    const defaultAdmin = await Admin.create({
      email: adminEmail,
      password: hashedPassword,
      name: adminName,
      isGoogleAuth: false,
      isDefaultAdmin: true,
    });

    // ────────────────────────────────────────────────────────────────
    // 6. Success output
    // ────────────────────────────────────────────────────────────────
    console.log("✅ Default admin created successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📧 Email:   ", adminEmail);
    console.log("🔑 Password:", adminPassword);
    console.log("👤 Name:    ", adminName);
    console.log("🆔 Admin ID:", defaultAdmin._id);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(
      "⚠️  IMPORTANT: Change the default password after first login!"
    );
    console.log("🔐 Login URL: http://localhost:5173/login");
  } catch (error) {
    // ────────────────────────────────────────────────────────────────
    // 7. Error handling
    // ────────────────────────────────────────────────────────────────
    console.error("❌ Error creating default admin:");
    console.error(error.message);

    if (error.code === 11000) {
      console.log("💡 Tip: An admin with this email already exists");
    }
  } finally {
    // ────────────────────────────────────────────────────────────────
    // 8. Clean‑up DB connection
    // ────────────────────────────────────────────────────────────────
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log("📦 Database connection closed");
    }
  }
}

/* ------------------------------------------------------------------ */
/* Allow script to be executed directly (node createDefaultAdmin.js)  */
/* ------------------------------------------------------------------ */
if (require.main === module) {
  createDefaultAdmin()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = createDefaultAdmin;
