const { PerspectiveApi } = require("@google-cloud/perspectiveapi-client");
const axios = require("axios");

// Initialize Perspective API
const perspective = new PerspectiveApi({
  apiKey: process.env.PERSPECTIVE_API_KEY,
});

// Perspective API moderation
async function perspectiveModeration(text) {
  if (!process.env.PERSPECTIVE_API_KEY) {
    throw new Error("Perspective API key not configured");
  }

  const request = {
    comment: { text },
    requestedAttributes: {
      TOXICITY: {},
      SEVERE_TOXICITY: {},
      IDENTITY_ATTACK: {},
      INSULT: {},
      PROFANITY: {},
      THREAT: {},
    },
  };

  const response = await perspective.comments.analyze({
    resource: request,
  });

  const scores = response.data.attributeScores;
  const toxicityScore = scores.TOXICITY.summaryScore.value;
  const severeToxicity = scores.SEVERE_TOXICITY.summaryScore.value;

  // Flag if toxicity > 70% OR severe toxicity > 50%
  const flagged = toxicityScore > 0.7 || severeToxicity > 0.5;

  return {
    flagged,
    score: toxicityScore,
    provider: "Perspective API",
    reason: flagged ? "High toxicity detected by Perspective AI" : "Clean",
    details: {
      toxicity: toxicityScore,
      severeToxicity: severeToxicity,
      identityAttack: scores.IDENTITY_ATTACK.summaryScore.value,
      insult: scores.INSULT.summaryScore.value,
      profanity: scores.PROFANITY.summaryScore.value,
      threat: scores.THREAT.summaryScore.value,
    },
  };
}

// OpenAI moderation (fallback)
async function openAIModeration(text) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  const response = await axios.post(
    "https://api.openai.com/v1/moderations",
    { input: text },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  const result = response.data.results[0];

  return {
    flagged: result.flagged,
    provider: "OpenAI",
    reason: result.flagged ? "Content flagged by OpenAI moderation" : "Clean",
    details: result.categories,
    scores: result.category_scores,
  };
}

// Simple rule-based moderation
function ruleBasedModeration(text) {
  const badWords = [
    "spam",
    "scam",
    "hate",
    "abuse",
    "threat",
    "violence",
    "kill",
    "die",
    "stupid",
    "idiot",
    "moron",
    "loser",
    "ugly",
    "fat",
    "racist",
  ];

  const suspiciousPatterns = [
    /(.)\1{5,}/g, // Repeated characters (aaaaaa)
    /[A-Z]{15,}/g, // Excessive caps
    /\b\d{10,}\b/g, // Long numbers (phone/personal)
    /(.{1,3})\1{4,}/g, // Repeated patterns
  ];

  const lowerText = text.toLowerCase();

  // Check for bad words
  const containsBadWords = badWords.some((word) => lowerText.includes(word));

  // Check for suspicious patterns
  const containsSuspicious = suspiciousPatterns.some((pattern) =>
    pattern.test(text)
  );

  // Check for excessive length or spam
  const tooLong = text.length > 2000;
  const hasSpam = /(.)\1{8,}/.test(text);

  const flagged = containsBadWords || containsSuspicious || tooLong || hasSpam;

  return {
    flagged,
    provider: "Rule-based Filter",
    reason: flagged ? "Content flagged by automated rules" : "Clean",
    details: {
      badWords: containsBadWords,
      suspicious: containsSuspicious,
      tooLong,
      spam: hasSpam,
    },
  };
}

// Main moderation function with fallback logic
async function moderateFeedback(text) {
  if (!text || text.trim().length === 0) {
    return { flagged: false, reason: "Empty text", provider: "validation" };
  }

  // Perspective API first (free, purpose-built)
  if (process.env.PERSPECTIVE_API_KEY) {
    try {
      console.log("Trying Perspective API moderation...");
      const result = await perspectiveModeration(text);
      console.log(
        `Perspective API result: ${result.flagged ? "FLAGGED" : "CLEAN"}`
      );
      return result;
    } catch (err) {
      console.warn("Perspective API failed:", err.message);
    }
  }

  // OpenAI moderation (fallback)
  if (process.env.OPENAI_API_KEY) {
    try {
      console.log("Trying OpenAI moderation...");
      const result = await openAIModeration(text);
      console.log(`OpenAI result: ${result.flagged ? "FLAGGED" : "CLEAN"}`);
      return result;
    } catch (err) {
      console.warn("OpenAI moderation failed:", err.message);
    }
  }

  // Rule-based moderation (always available)
  console.log("Using rule-based moderation...");
  const result = ruleBasedModeration(text);
  console.log(`Rule-based result: ${result.flagged ? "FLAGGED" : "CLEAN"}`);
  return result;
}

module.exports = moderateFeedback;
