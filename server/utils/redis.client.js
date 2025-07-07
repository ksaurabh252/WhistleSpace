// redis.client.js
const redis = require("redis");

// Create a Redis client
const client = redis.createClient({
  host: process.env.REDIS_HOST || "localhost", // Redis host (e.g., "localhost")
  port: process.env.REDIS_PORT || 6379, // Redis port (default is 6379)
  password: process.env.REDIS_PASSWORD || "", // Optional password if required
});

// Handle Redis connection
client.on("connect", () => {
  console.log("Connected to Redis");
});

client.on("error", (err) => {
  console.error("Redis error: ", err);
});

module.exports = client;
