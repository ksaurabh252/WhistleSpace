const { OAuth2Client } = require("google-auth-library");

const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin.model");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
async function googleLogin(req, res) {
  try {
    const { token: googleToken } = req.body;

    if (!googleToken) {
      return res.status(400).json({ error: "Google token is required" });
    }

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
async function signup(req, res) {
  try {
    const { email, password, googleToken } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // If signing up with Google, verify token
    let googleData = null;
    if (googleToken) {
      const ticket = await client.verifyIdToken({
        idToken: googleToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      googleData = ticket.getPayload();
    }

    // Create user (with or without Google)
    user = await User.create({
      email,
      password: password ? await bcrypt.hash(password, 10) : undefined,
      name: googleData?.name,
      avatar: googleData?.picture,
      isGoogleAuth: !!googleToken,
    });

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: "Signup failed" });
  }
}

module.exports = { googleLogin };
