const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// Helper: Use NODE_ENV to determine local vs production
const isLocal = process.env.NODE_ENV !== "production";
const cookieOptions = {
  httpOnly: true,
  sameSite: "None",
  secure: !isLocal, // true in production (HTTPS), false in local (HTTP)
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
};

// POST /admin/init
router.post("/init", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Username and password required" });

  let admin = await Admin.findOne({ username });
  if (!admin) {
    admin = new Admin({ username, password });
    await admin.save();
    return res.json({ message: "Admin created" });
  }
  res.json({ message: "Admin already exists" });
});

// POST /admin/login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Username and password required" });

  const admin = await Admin.findOne({ username });
  if (!admin) return res.status(401).json({ error: "Invalid credentials" });

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { id: admin._id, username: admin.username },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { id: admin._id, username: admin.username },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "24h" }
  );
  admin.refreshToken = refreshToken;
  await admin.save();

  // Set refresh token as HTTP-only cookie
  res.cookie("refreshToken", refreshToken, cookieOptions);

  // Send access token in response
  res.json({ token });
});

// POST /admin/refresh
router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken)
    return res.status(401).json({ error: "No refresh token provided" });
  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const admin = await Admin.findById(payload.id);
    if (!admin || admin.refreshToken !== refreshToken) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }
    const accessToken = jwt.sign(
      { id: admin._id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );
    res.json({ accessToken });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

// POST /admin/logout
router.post("/logout", async (req, res) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken) return res.sendStatus(204); // No content

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const admin = await Admin.findById(payload.id);

    if (!admin || admin.refreshToken !== refreshToken) {
      // Even if not found, clear cookie for security
      res.clearCookie("refreshToken", cookieOptions);
      return res.sendStatus(204);
    }

    // Clear refresh token in DB
    admin.refreshToken = null;
    await admin.save();

    // Clear cookie
    res.clearCookie("refreshToken", cookieOptions);

    res.sendStatus(204); // No content
  } catch (err) {
    console.error("Logout error:", err);
    res.clearCookie("refreshToken", cookieOptions);
    res.sendStatus(403); // Forbidden or other appropriate status
  }
});

module.exports = router;
