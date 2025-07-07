const User = require("../models/User.model");

/**
 * Sends a notification to a user by their ID.
 * @param {String} userId - The ID of the user to notify.
 * @param {String} message - The notification message.
 * @param {String} type - The type of notification ('info', 'warning', 'ban', etc.).
 */
async function sendNotification(userId, message, type = "info") {
  try {
    const user = await User.findById(userId);
    if (user) {
      // Add the notification to the user using a model method
      await user.addNotification(message, type);
      console.log(`📨 Notification sent to user ${user.systemId}: ${message}`);
    }
  } catch (error) {
    console.error("Notification error:", error);
  }
}

/**
 * Sends a warning notification to a user based on their current warning count.
 * The message and type escalate with each additional warning.
 * @param {String} userId - The ID of the user to notify.
 * @param {Number} warningCount - The user's current number of warnings.
 */
async function sendWarningNotification(userId, warningCount) {
  let message;
  let type = "warning";

  if (warningCount === 1) {
    message =
      "⚠️ You have been flagged once. Please follow community guidelines to avoid further action.";
  } else if (warningCount === 2) {
    message =
      "⚠️ You have received two harassment warnings. One more violation and your account will be temporarily blocked.";
  } else if (warningCount >= 3) {
    message =
      "🚫 Your account has been temporarily blocked for 24 hours due to multiple violations.";
    type = "ban";
  }

  // Delegate to the main notification sender
  await sendNotification(userId, message, type);
}

module.exports = {
  sendNotification,
  sendWarningNotification,
};
