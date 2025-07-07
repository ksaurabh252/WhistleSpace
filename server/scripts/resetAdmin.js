const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin.model");
require("dotenv").config();

async function resetAdmins() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("📦 Connected to MongoDB");

    // Show current admins
    const existingAdmins = await Admin.find({});
    console.log(`📋 Found ${existingAdmins.length} existing admin(s):`);
    existingAdmins.forEach((admin) => {
      console.log(`- ${admin.email} (${admin.name || "No name"})`);
    });

    // Delete all admins
    const deleteResult = await Admin.deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} admin(s)`);

    // Create default admin
    const email = process.env.DEFAULT_ADMIN_EMAIL || "admin@whistlespace.com";
    const password = process.env.DEFAULT_ADMIN_PASSWORD || "Admin123!";
    const hashedPassword = await bcrypt.hash(password, 12);

    const defaultAdmin = await Admin.create({
      email,
      password: hashedPassword,
      name: "WhistleSpace Administrator",
      isDefaultAdmin: true,
    });

    console.log("✅ Default admin created!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📧 Email:", email);
    console.log("🔑 Password:", password);
    console.log("👤 Name:", defaultAdmin.name);
    console.log("🆔 ID:", defaultAdmin._id);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("📦 Database connection closed");
  }
}

resetAdmins();
