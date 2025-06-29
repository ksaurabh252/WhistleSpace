const mongoose = require("mongoose");
require("dotenv").config();

async function testConnection() {
  try {
    console.log("Attempting to connect to MongoDB...");
    console.log("URI:", process.env.MONGO_URI.replace(/:[^:@]*@/, ":****@")); // Hide password in logs

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected successfully!");

    // List databases to verify connection
    const admin = mongoose.connection.db.admin();
    const dbInfo = await admin.listDatabases();
    console.log(
      "Available databases:",
      dbInfo.databases.map((db) => db.name)
    );

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
  }
}

testConnection();
