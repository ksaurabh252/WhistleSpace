const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin.model");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Logs in an admin using Google OAuth token.
 *
 * @async
 * @function googleLogin
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>} Responds with JWT and user info or error message.
 */
async function googleLogin(req, res) {
  try {
    const { token: googleToken } = req.body;

    if (!googleToken) {
      return res.status(400).json({ error: "Google token is required" });
    }

    // Verify the ID token and extract payload
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email, name, picture, sub } = ticket.getPayload();

    // Find or create admin
    let admin = await Admin.findOne({ email });
    if (!admin) {
      admin = await Admin.create({
        email,
        name,
        googleId: sub,
        avatar: picture,
        isGoogleAuth: true,
      });
    }

    // Sign and return a JWT token
    const jwtToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      token: jwtToken,
      user: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        avatar: admin.avatar,
        isGoogleAuth: true,
      },
    });
  } catch (err) {
    console.error("Google auth error:", err);
    res.status(401).json({
      error: "Google authentication failed",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
}

/**
 * Registers a new user using email/password or Google OAuth.
 *
 * @async
 * @function signup
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>} Responds with JWT and user info or error message.
 *
 * @note `User` and `bcrypt` must be imported for this function to work.
 * This function is not currently exported.
 */
async function signup(req, res) {
  try {
    const { email, password, googleToken } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: "Email already exists" });
    }

    let googleData = null;

    if (googleToken) {
      const ticket = await client.verifyIdToken({
        idToken: googleToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      googleData = ticket.getPayload();
    }

    user = await User.create({
      email,
      password: password ? await bcrypt.hash(password, 10) : undefined,
      name: googleData?.name,
      avatar: googleData?.picture,
      isGoogleAuth: !!googleToken,
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: "Signup failed" });
  }
}

module.exports = { googleLogin };
