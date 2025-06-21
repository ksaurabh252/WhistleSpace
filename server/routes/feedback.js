const express = require("express");
const router = express.Router();
const Feedback = require("../models/Feedback");
const { unparse } = require("papaparse");

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

module.exports = router;
