const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin.model");
const { OAuth2Client } = require("google-auth-library");
const {
  UNAUTHORIZED,
  SERVER_ERROR,
  FORBIDDEN,
  BAD_REQUEST,
} = require("../utils/errorCodes");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// 🔐 Utility: Generate JWT token
const generateToken = (admin) =>
  jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

/**
 * Sends JWT token along with admin user info
 *
 * @param {Object} admin - Admin mongoose document
 * @param {Object} res - Express response object
 */
const sendToken = (admin, res) => {
  const token = generateToken(admin);
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
};

// 🧑‍💼 Signup
/**
 * Handles admin signup (supports both traditional and Google OAuth)
 */
async function signup(req, res) {
  try {
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

      const { sub, name, picture } = ticket.getPayload();

      admin = await Admin.create({
        email,
        googleId: sub,
        name,
        avatar: picture,
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

    sendToken(admin, res);
  } catch (err) {
    console.error("Signup error:", err);
    res.status(SERVER_ERROR).json({
      error: "Signup failed",
      code: "SIGNUP_ERROR",
    });
  }
}

// 🔐 Login
/**
 * Handles admin login (supports both traditional and Google OAuth)
 */
async function login(req, res) {
  try {
    const { email, password, token: googleToken } = req.body;

    if (googleToken) {
      // Google OAuth login flow
      const ticket = await client.verifyIdToken({
        idToken: googleToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const { email: googleEmail, name, picture, sub } = ticket.getPayload();

      let admin = await Admin.findOne({ email: googleEmail });

      if (!admin) {
        admin = await Admin.create({
          email: googleEmail,
          googleId: sub,
          name,
          avatar: picture,
          isGoogleAuth: true,
        });
      }

      return sendToken(admin, res);
    }

    if (!email || !password) {
      return res.status(BAD_REQUEST).json({
        error: "Email and password required",
        code: "MISSING_CREDENTIALS",
      });
    }

    const admin = await Admin.findOne({ email });

    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(UNAUTHORIZED).json({
        error: "Invalid credentials",
        code: "INVALID_CREDENTIALS",
      });
    }

    sendToken(admin, res);
  } catch (err) {
    console.error("Login error:", err);
    res.status(SERVER_ERROR).json({
      error: "Login failed",
      code: "LOGIN_ERROR",
    });
  }
}

// 🔄 Refresh Token
/**
 * Refreshes JWT token for authenticated admin
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

    const token = generateToken(admin);
    res.json({ token });
  } catch (err) {
    console.error("Refresh token error:", err);
    res.status(FORBIDDEN).json({
      error: "Invalid refresh token",
      code: "INVALID_REFRESH_TOKEN",
    });
  }
}

// ✅ Validate Session
/**
 * Returns current authenticated admin session data
 */
const validate = (req, res) => {
  res.json({
    user: {
      id: req.admin.id,
      email: req.admin.email,
      name: req.admin.name,
      avatar: req.admin.avatar,
    },
  });
};

// 👤 Get Admin
/**
 * Retrieves admin details by ID
 */
async function getUser(req, res) {
  try {
    const admin = await Admin.findById(req.params.userId);

    if (!admin) {
      return res.status(404).json({
        error: "Admin not found",
        code: "ADMIN_NOT_FOUND",
      });
    }

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
  refreshToken,
  validate,
  getUser,
};
