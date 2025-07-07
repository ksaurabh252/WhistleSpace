/**
 * User Authentication Controller
 * Handles user registration, authentication, and profile management
 * Includes email encryption and security measures
 */

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/User.model");
const {
  sendNotification,
  sendWarningNotification,
} = require("../utils/notifications");
const {
  BAD_REQUEST,
  UNAUTHORIZED,
  SERVER_ERROR,
  FORBIDDEN,
  NOT_FOUND,
} = require("../utils/errorCodes");

/**
 * Encryption Configuration
 * Uses AES-256-CBC algorithm for email encryption
 * Falls back to JWT secret if encryption key is not provided
 */
const algorithm = "aes-256-cbc";
const secretKey =
  process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || "fallback-secret-key";

/**
 * Encrypts an email address
 * @param {string} email - The email to encrypt
 * @returns {string} - Encrypted email with IV prepended
 */
function encryptEmail(email) {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, secretKey);
    let encrypted = cipher.update(email, "utf8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
  } catch (error) {
    console.error("Encryption error:", error);
    return email; // Fallback for error cases
  }
}

/**
 * Decrypts an encrypted email address
 * @param {string} encryptedEmail - The encrypted email to decrypt
 * @returns {string} - Decrypted email address
 */
function decryptEmail(encryptedEmail) {
  try {
    if (!encryptedEmail.includes(":")) {
      return encryptedEmail; // Handle already decrypted emails
    }
    const textParts = encryptedEmail.split(":");
    const encryptedText = textParts.slice(1).join(":");
    const decipher = crypto.createDecipher(algorithm, secretKey);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    return encryptedEmail;
  }
}

/**
 * Generates a JWT token for user authentication
 * @param {Object} user - User document from database
 * @returns {string} - Signed JWT token
 */
function generateUserToken(user) {
  return jwt.sign(
    {
      id: user._id,
      type: "user",
      systemId: user.systemId,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

/**
 * User Registration Handler
 * Creates new user account with encrypted email
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function userSignup(req, res) {
  try {
    const { email, password, confirmPassword } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(BAD_REQUEST).json({
        error: "Email and password are required",
        code: "MISSING_CREDENTIALS",
      });
    }

    // Password validation
    if (password !== confirmPassword) {
      return res.status(BAD_REQUEST).json({
        error: "Passwords do not match",
        code: "PASSWORD_MISMATCH",
      });
    }

    if (password.length < 8) {
      return res.status(BAD_REQUEST).json({
        error: "Password must be at least 8 characters",
        code: "WEAK_PASSWORD",
      });
    }

    // Check for existing user
    const encryptedEmail = encryptEmail(email.toLowerCase());
    const existingUser = await User.findOne({ encryptedEmail });

    if (existingUser) {
      return res.status(BAD_REQUEST).json({
        error: "User already exists with this email",
        code: "EMAIL_EXISTS",
      });
    }

    // Create new user with hashed password
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      encryptedEmail,
      password: hashedPassword,
    });

    // Send welcome notification
    await user.addNotification(
      "Welcome to WhistleSpace! Please follow our community guidelines to maintain a safe environment.",
      "info"
    );

    // Generate authentication token
    const token = generateUserToken(user);

    // Send success response
    res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: {
        id: user.encryptedUserId,
        systemId: user.systemId,
        email: email,
        warnings: user.warnings,
        notifications: user.notifications.filter((n) => !n.read).length,
      },
    });
  } catch (error) {
    console.error("User signup error:", error);
    res.status(SERVER_ERROR).json({
      error: "Account creation failed",
      code: "SIGNUP_ERROR",
    });
  }
}

/**
 * User Login Handler
 * Authenticates user and returns JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function userLogin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(BAD_REQUEST).json({
        error: "Email and password are required",
        code: "MISSING_CREDENTIALS",
      });
    }

    // Find user by encrypted email
    const encryptedEmail = encryptEmail(email.toLowerCase());
    const user = await User.findOne({ encryptedEmail });

    // Validate credentials
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(UNAUTHORIZED).json({
        error: "Invalid email or password",
        code: "INVALID_CREDENTIALS",
      });
    }

    // Check account status
    if (!user.isActive) {
      return res.status(FORBIDDEN).json({
        error: "Account has been deactivated",
        code: "ACCOUNT_DEACTIVATED",
      });
    }

    if (user.isBanned) {
      const banTimeLeft = Math.ceil(
        (user.banUntil - new Date()) / (1000 * 60 * 60)
      ); // hours
      return res.status(FORBIDDEN).json({
        error: `Account temporarily banned for ${banTimeLeft} more hours`,
        code: "ACCOUNT_BANNED",
        banUntil: user.banUntil,
      });
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();

    // Generate and return token
    const token = generateUserToken(user);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.encryptedUserId,
        systemId: user.systemId,
        email: email,
        warnings: user.warnings,
        notifications: user.notifications.filter((n) => !n.read).length,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error("User login error:", error);
    res.status(SERVER_ERROR).json({
      error: "Login failed",
      code: "LOGIN_ERROR",
    });
  }
}

/**
 * Password Reset Request Handler
 * Initiates password reset process with email token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(BAD_REQUEST).json({
        error: "Email is required",
        code: "MISSING_EMAIL",
      });
    }

    // Find user without revealing existence status
    const encryptedEmail = encryptEmail(email.toLowerCase());
    const user = await User.findOne({ encryptedEmail });

    if (!user) {
      // Security: Don't reveal if email exists
      return res.json({
        success: true,
        message:
          "If an account exists with this email, you will receive password reset instructions.",
      });
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Configure email transport
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Send reset email
    const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "WhistleSpace - Password Reset Request",
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested a password reset for your WhistleSpace account.</p>
        <p>Click the link below to reset your password (valid for 10 minutes):</p>
        <a href="${resetURL}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: "Password reset instructions sent to your email",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(SERVER_ERROR).json({
      error: "Failed to process password reset request",
      code: "FORGOT_PASSWORD_ERROR",
    });
  }
}

/**
 * Password Reset Completion Handler
 * Validates reset token and updates password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function resetPassword(req, res) {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    // Validate input
    if (!password || !confirmPassword) {
      return res.status(BAD_REQUEST).json({
        error: "Password and confirmation are required",
        code: "MISSING_PASSWORD",
      });
    }

    if (password !== confirmPassword) {
      return res.status(BAD_REQUEST).json({
        error: "Passwords do not match",
        code: "PASSWORD_MISMATCH",
      });
    }

    if (password.length < 8) {
      return res.status(BAD_REQUEST).json({
        error: "Password must be at least 8 characters",
        code: "WEAK_PASSWORD",
      });
    }

    // Find user by hashed token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(BAD_REQUEST).json({
        error: "Invalid or expired reset token",
        code: "INVALID_TOKEN",
      });
    }

    // Update password and clear reset fields
    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Send confirmation notification
    await user.addNotification(
      "Your password has been successfully reset.",
      "info"
    );

    res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(SERVER_ERROR).json({
      error: "Failed to reset password",
      code: "RESET_PASSWORD_ERROR",
    });
  }
}

/**
 * User Profile Retrieval Handler
 * Returns authenticated user's profile information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getUserProfile(req, res) {
  try {
    const user = await User.findById(req.user.id).select(
      "-password -resetPasswordToken -resetPasswordExpires"
    );

    if (!user) {
      return res.status(NOT_FOUND).json({
        error: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    // Decrypt email for display
    const decryptedEmail = decryptEmail(user.encryptedEmail);

    res.json({
      user: {
        id: user.encryptedUserId,
        systemId: user.systemId,
        email: decryptedEmail,
        warnings: user.warnings,
        isActive: user.isActive,
        isBanned: user.isBanned,
        banUntil: user.banUntil,
        notifications: user.notifications.sort(
          (a, b) => b.timestamp - a.timestamp
        ),
        flagHistory: user.flagHistory.slice(-5), // Last 5 flags
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(SERVER_ERROR).json({
      error: "Failed to get user profile",
      code: "PROFILE_ERROR",
    });
  }
}

module.exports = {
  userSignup,
  userLogin,
  forgotPassword,
  resetPassword,
  getUserProfile,
  encryptEmail,
  decryptEmail,
  generateUserToken,
};
