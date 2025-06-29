const express = require("express");
const router = express.Router();
const Feedback = require("../models/Feedback");
const { unparse } = require("papaparse");
const nodemailer = require("nodemailer");
const verifyToken = require("../middleware/auth.middleware");
const { categorize, analyzeSentiment } = require("../utils/ai");

// -----------------------------
// Email Transport Configuration
// -----------------------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_EMAIL_PASS,
  },
});

// ----------------------------------
// DELETE Feedback by ID (Protected)
// ----------------------------------
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await Feedback.findByIdAndDelete(req.params.id);
    res.json({ message: "Feedback deleted" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});

// ----------------------------------------------------
// GET Feedbacks with Filters, Pagination, Search, etc.
// ----------------------------------------------------
router.get("/", async (req, res) => {
  const {
    search = "",
    page = 1,
    limit = 5,
    sentiment,
    category,
    from,
    to,
  } = req.query;

  // Build MongoDB query object based on filters
  const query = {
    ...(search ? { text: { $regex: search, $options: "i" } } : {}),
    ...(sentiment ? { sentiment } : {}),
    ...(req.query.status ? { status: req.query.status } : {}),
    ...(category ? { category } : {}),
    ...(from || to
      ? {
          timestamp: {
            ...(from ? { $gte: new Date(from) } : {}),
            ...(to ? { $lte: new Date(to) } : {}),
          },
        }
      : {}),
  };

  try {
    const total = await Feedback.countDocuments(query);
    const feedbacks = await Feedback.find(query)
      .sort({ timestamp: -1 }) // Recent first
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ feedbacks, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error retrieving feedbacks" });
  }
});

// -----------------------------
// Export Feedbacks to CSV File
// -----------------------------
router.get("/export", async (req, res) => {
  const { search = "", sentiment, category, from, to } = req.query;

  const query = {
    ...(search ? { text: { $regex: search, $options: "i" } } : {}),
    ...(sentiment ? { sentiment } : {}),
    ...(category ? { category } : {}),
    ...(from || to
      ? {
          timestamp: {
            ...(from ? { $gte: new Date(from) } : {}),
            ...(to ? { $lte: new Date(to) } : {}),
          },
        }
      : {}),
  };

  try {
    const feedbacks = await Feedback.find(query).sort({ timestamp: -1 });

    // Format data for CSV
    const csvData = feedbacks.map((fb) => ({
      Feedback: fb.text,
      Email: fb.email || "Anonymous",
      Sentiment: fb.sentiment || "-",
      Category: fb.category || "-",
      Date: new Date(fb.timestamp).toLocaleDateString(),
    }));

    const csv = unparse(csvData);

    res.header("Content-Type", "text/csv");
    res.attachment("feedbacks.csv");
    return res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to export feedbacks" });
  }
});

// ----------------------------------------
// POST New Feedback (with analysis logic)
// ----------------------------------------
router.post("/", async (req, res) => {
  try {
    const feedback = new Feedback(req.body);

    // Optional auto-categorization and sentiment analysis
    if (!feedback.category) {
      feedback.category = await categorize(feedback.text);
    }
    if (!feedback.sentiment) {
      feedback.sentiment = await analyzeSentiment(feedback.text);
    }

    await feedback.save();
    res.json(feedback);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error saving feedback" });
  }
});

// ----------------------------------------------
// PATCH Feedback by ID (update status + alert)
// ----------------------------------------------
router.patch("/:id", async (req, res) => {
  const { status } = req.body;
  try {
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({ error: "Feedback not found" });
    }

    // Send alert email if category is Harassment
    if (feedback.category === "Harassment") {
      await transporter.sendMail({
        from: `"WhistleSpace Alert" <${process.env.ADMIN_EMAIL}>`,
        to: process.env.ADMIN_EMAIL,
        subject: "⚠️ Harassment Feedback Submitted",
        text: `A feedback marked as harassment:\n\n${feedback.text}`,
      });
    }

    res.json(feedback);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error updating feedback" });
  }
});

// --------------------------------------------------
// PATCH Feedback Status (Protected by Auth Token)
// --------------------------------------------------
router.patch("/:id/status", verifyToken, async (req, res) => {
  const { status } = req.body;
  try {
    const updated = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update status" });
  }
});

// --------------------------------------
// POST a Comment to Specific Feedback
// --------------------------------------
router.post("/:id/comments", async (req, res) => {
  const { text, anonymous = true } = req.body;
  try {
    const fb = await Feedback.findById(req.params.id);
    fb.comments.push({ text, anonymous });
    await fb.save();
    res.json({ comments: fb.comments });
  } catch (err) {
    res.status(500).json({ error: "Could not add comment" });
  }
});

module.exports = router;
