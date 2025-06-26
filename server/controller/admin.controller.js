const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin.model");
const {
  UNAUTHORIZED,
  SERVER_ERROR,
  FORBIDDEN,
  BAD_REQUEST,
} = require("../utils/errorCodes");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Handles admin signup (both email/password and Google OAuth)
 */
async function signup(req, res) {
  try {
    console.log("Signup request body:", req.body); // Add this line

    const { email, password, googleToken } = req.body;

    if (!email) {
      return res.status(BAD_REQUEST).json({
        error: "Email is required",
        code: "MISSING_EMAIL",
      });
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(BAD_REQUEST).json({
        error: "Email already in use",
        code: "EMAIL_IN_USE",
      });
    }

    let admin;
    if (googleToken) {
      // Google OAuth signup flow
      const ticket = await client.verifyIdToken({
        idToken: googleToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();

      admin = await Admin.create({
        email,
        googleId: payload.sub,
        name: payload.name,
        avatar: payload.picture,
        isGoogleAuth: true,
      });
    } else {
      // Traditional email/password signup
      if (!password) {
        return res.status(BAD_REQUEST).json({
          error: "Password is required",
          code: "MISSING_PASSWORD",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      admin = await Admin.create({
        email,
        password: hashedPassword,
        isGoogleAuth: false,
      });
    }

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      token,
      user: {
        id: admin._id,
        email: admin.email,
        isGoogleAuth: admin.isGoogleAuth,
        name: admin.name,
        avatar: admin.avatar,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(SERVER_ERROR).json({
      error: "Server error during signup",
      code: "SIGNUP_ERROR",
    });
  }
}

/**
 * Handles admin login (both email/password and Google OAuth)
 */
async function login(req, res) {
  try {
    const { email, password, token: googleToken } = req.body;

    // Google OAuth login flow
    if (googleToken) {
      const ticket = await client.verifyIdToken({
        idToken: googleToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const { email: googleEmail, name, picture, sub } = ticket.getPayload();

      let admin = await Admin.findOne({ email: googleEmail });

      // Auto-create admin if not found (optional)
      if (!admin) {
        admin = await Admin.create({
          email: googleEmail,
          googleId: sub,
          name,
          avatar: picture,
          isGoogleAuth: true,
        });
      }

      const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });

      return res.json({
        token,
        user: {
          id: admin._id,
          email: admin.email,
          isGoogleAuth: true,
          name: admin.name,
          avatar: admin.avatar,
        },
      });
    }

    // Traditional email/password login flow
    if (!email || !password) {
      return res.status(BAD_REQUEST).json({
        error: "Email and password required",
        code: "MISSING_CREDENTIALS",
      });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(UNAUTHORIZED).json({
        error: "Invalid credentials",
        code: "INVALID_CREDENTIALS",
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(UNAUTHORIZED).json({
        error: "Invalid credentials",
        code: "INVALID_CREDENTIALS",
      });
    }

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      token,
      user: {
        id: admin._id,
        email: admin.email,
        isGoogleAuth: admin.isGoogleAuth,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(SERVER_ERROR).json({
      error: "Login failed",
      code: "LOGIN_ERROR",
    });
  }
}

/**
 * Refreshes JWT token
 */
async function refreshToken(req, res) {
  try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(UNAUTHORIZED).json({
        error: "Admin not found",
        code: "ADMIN_NOT_FOUND",
      });
    }

    const newToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({ token: newToken });
  } catch (err) {
    console.error("Refresh token error:", err);
    res.status(FORBIDDEN).json({
      error: "Invalid refresh token",
      code: "INVALID_REFRESH_TOKEN",
    });
  }
}

/**
 * Validates admin token
 */
async function validate(req, res) {
  res.json({
    user: {
      id: req.admin.id,
      email: req.admin.email,
    },
  });
}
async function getUser(req, res) {
  try {
    const admin = await Admin.findById(req.params.userId);
    if (!admin) {
      return res.status(404).json({
        error: "Admin not found",
        code: "ADMIN_NOT_FOUND",
      });
    }

    // Return safe user data (without password)
    res.json({
      id: admin._id,
      email: admin.email,
      name: admin.name,
      avatar: admin.avatar,
      isGoogleAuth: admin.isGoogleAuth,
    });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({
      error: "Server error retrieving user",
      code: "USER_FETCH_ERROR",
    });
  }
}
module.exports = {
  signup,
  login,
  validate,
  refreshToken,
  getUser,
};
