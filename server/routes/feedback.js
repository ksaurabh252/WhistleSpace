const express = require("express");
const router = express.Router();
const Feedback = require("../models/Feedback");
const { unparse } = require("papaparse");
const nodemailer = require("nodemailer");
const verifyToken = require("../middleware/auth.middleware");

// Email setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_EMAIL_PASS,
  },
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await Feedback.findByIdAndDelete(req.params.id);
    res.json({ message: "Feedback deleted" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});

// GET /api/feedback?search=&page=&limit=
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
    const total = await Feedback.countDocuments(query);
    const feedbacks = await Feedback.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ feedbacks, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error retrieving feedbacks" });
  }
});

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

// POST /api/feedback
router.post("/", async (req, res) => {
  try {
    const feedback = new Feedback(req.body);
    const saved = await feedback.save();
    res.json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/:id", async (req, res) => {
  const { status } = req.body;
  try {
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!feedback) return res.status(404).json({ error: "Feedback not found" });

    // Email alert if category is Harassment
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
module.exports = router;
