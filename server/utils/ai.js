const OpenAI = require("openai");
require("dotenv").config();

// Initialize OpenAI client with your API key
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Categorize feedback into one of the following:
 * Harassment, Suggestion, Technical Issue, Praise, Other
 *
 * @param {string} text - The feedback text
 * @returns {Promise<string>} - The predicted category
 */
async function categorize(text) {
  try {
    const prompt = `Categorize this feedback into one: Harassment, Suggestion, Technical Issue, Praise, Other. Feedback: ${text}`;
    const res = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });
    return res.choices[0].message.content.trim();
  } catch (err) {
    console.error("[OpenAI Error - categorize]", err);
    return "Other"; // fallback
  }
}

/**
 * Analyze the sentiment of a feedback message.
 * Possible outputs: Positive, Negative, Neutral
 *
 * @param {string} text - The feedback text
 * @returns {Promise<string>} - The detected sentiment
 */
async function analyzeSentiment(text) {
  try {
    const prompt = `What is the overall sentiment of this feedback? (Positive, Negative, Neutral): ${text}`;
    const res = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });
    return res.choices[0].message.content.trim();
  } catch (err) {
    console.error("[OpenAI Error - sentiment]", err);
    return "Neutral"; // fallback
  }
}

// Export functions for use in other files
module.exports = {
  categorize,
  analyzeSentiment,
};
