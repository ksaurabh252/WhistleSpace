const axios = require("axios");

async function moderateFeedback(text) {
  // Example: OpenAI Moderation API
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OpenAI API key not set");
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/moderations",
      { input: text },
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    // response.data.results[0].flagged is true if inappropriate
    return response.data.results[0];
  } catch (err) {
    console.error("AI moderation error:", err.response?.data || err.message);
    // Fail open: allow feedback if AI fails, but log it
    return { flagged: false };
  }
}

module.exports = moderateFeedback;
