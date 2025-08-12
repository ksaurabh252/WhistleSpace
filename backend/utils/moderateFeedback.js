const axios = require("axios");

/*
  Lightweight moderation pipeline

  Order of checks (fast to slow):
  1) Rule-based (local): quick bad-words and simple spam patterns.
  2) One AI provider (if configured): Perspective (preferred) or OpenAI.
     - Short HTTP timeout to avoid slow responses and reduce load.
  3) If the primary AI call fails, optionally try the other provider.

  Returns a consistent object: { flagged, reason, provider, ... }

  Environment variables:
  - PERSPECTIVE_API_KEY (optional)
  - OPENAI_API_KEY (optional)
  - MODERATION_TIMEOUT_MS (optional, default 2000ms)
*/

// Create an HTTP client with a tight timeout so external calls don't hang.
const HTTP_TIMEOUT_MS = Number(process.env.MODERATION_TIMEOUT_MS || 2000);
const http = axios.create({ timeout: HTTP_TIMEOUT_MS });

/**
 * Calls Google's Perspective API to score toxicity and related attributes.
 * Flags if any key metric crosses the threshold.
 */
async function perspectiveModeration(text) {
  const API_KEY = process.env.PERSPECTIVE_API_KEY;
  if (!API_KEY) throw new Error("Perspective API key not configured");

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

  const url = `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${API_KEY}`;
  const response = await http.post(url, request);

  const scores = response.data?.attributeScores ?? {};
  const getAttr = (name) => scores?.[name]?.summaryScore?.value ?? 0;

  const toxicityScore = getAttr("TOXICITY");
  const severeToxicity = getAttr("SEVERE_TOXICITY");
  const threatScore = getAttr("THREAT");

  const flagged =
    toxicityScore > 0.5 || severeToxicity > 0.5 || threatScore > 0.5;

  return {
    flagged,
    score: toxicityScore,
    provider: "Perspective API",
    reason: flagged ? "High toxicity detected by Perspective AI" : "Clean",
    details: {
      toxicity: toxicityScore,
      severeToxicity,
      identityAttack: getAttr("IDENTITY_ATTACK"),
      insult: getAttr("INSULT"),
      profanity: getAttr("PROFANITY"),
      threat: threatScore,
    },
  };
}

/**
 * Calls OpenAI's Moderation endpoint.
 * Returns categories and scores; flags when OpenAI flags.
 */
async function openAIModeration(text) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) throw new Error("OpenAI API key not configured");

  const response = await http.post(
    "https://api.openai.com/v1/moderations",

    { input: text },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  const result = response.data?.results?.[0] ?? {
    flagged: false,
    categories: {},
    category_scores: {},
  };

  return {
    flagged: result.flagged,
    provider: "OpenAI",
    reason: result.flagged ? "Content flagged by OpenAI moderation" : "Clean",
    details: result.categories,
    scores: result.category_scores,
  };
}

/**
 * Super-fast local checks:
 * - Looks for simple bad words (substring match).
 * - Detects spammy patterns (repeated chars, ALL CAPS, etc.).
 * - Flags if text is excessively long.
 */
function ruleBasedModeration(text) {
  // Basic word list (substring match).
  const badWords = [
    "spam",
    "scam",
    "hate",
    "abuse",
    "threat",
    "violence",
    "die",
    "stupid",
    "idiot",
    "moron",
    "loser",
    "ugly",
    "fat",
    "racist",
  ];

  // Simple patterns to catch spammy or noisy text.
  const suspiciousPatterns = [
    /(.)\1{5,}/g, // 6+ repeated characters
    /[A-Z]{15,}/g, // 15+ consecutive uppercase letters
    /\b\d{10,}\b/g, // very long numbers
    /(.{1,3})\1{4,}/g, // short chunk repeated 5+ times
  ];

  const lowerText = text.toLowerCase();

  // Quick bad-words check (fast path).
  const containsBadWords = badWords.some((word) => lowerText.includes(word));

  // Additional lightweight checks.
  const containsSuspicious = suspiciousPatterns.some((pattern) =>
    pattern.test(text)
  );
  const tooLong = text.length > 2000;
  const hasSpam = /(.)\1{8,}/.test(text); // 9+ repeated characters

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

/**
 * Main entry: runs the moderation pipeline.
 * 1) Rule-based first (no network).
 * 2) One AI provider (Perspective preferred, else OpenAI).
 * 3) If primary AI fails, try the other (to be resilient).
 */
async function moderateFeedback(text) {
  // Treat empty or whitespace-only input as clean (nothing to moderate).
  if (!text || text.trim().length === 0) {
    return { flagged: false, reason: "Empty text", provider: "validation" };
  }

  // 1) Fast local check first to avoid external calls on obvious cases.
  const ruleResult = ruleBasedModeration(text);
  if (ruleResult.flagged) return ruleResult;

  // 2) Choose ONE primary AI provider to minimize load and latency.
  const hasPerspective = !!process.env.PERSPECTIVE_API_KEY;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;

  const primaryProvider = hasPerspective
    ? perspectiveModeration
    : hasOpenAI
    ? openAIModeration
    : null;

  // Secondary is only used if the primary fails (error), not for clean double-checks.
  const secondaryProvider =
    hasPerspective && hasOpenAI
      ? primaryProvider === perspectiveModeration
        ? openAIModeration
        : perspectiveModeration
      : null;

  // If no external providers are configured, the local rule-based result is final.
  if (!primaryProvider) {
    return { flagged: false, reason: "Clean", provider: "Rule-based only" };
  }

  // 3) Try the primary AI provider (short timeout caps latency).
  try {
    const primaryResult = await primaryProvider(text);
    if (primaryResult.flagged) return primaryResult;
  } catch (_) {
    // If the primary provider fails, optionally try the other one.
    if (secondaryProvider) {
      try {
        const secondaryResult = await secondaryProvider(text);
        if (secondaryResult.flagged) return secondaryResult;
      } catch (_) {
        // Ignore errors; we'll treat as clean below.
      }
    }
  }

  // If all checks pass, the text is considered clean.
  return { flagged: false, reason: "Clean", provider: "All" };
}

module.exports = moderateFeedback;
