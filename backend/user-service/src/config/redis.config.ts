import { createClient } from "redis"; // Ensure redis is installed: npm install redis

// Redis client setup
const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379", // Use environment variable or default
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

// Connect to Redis
(async () => {
  try {
    await redisClient.connect();
    console.log("Connected to Redis");
  } catch (err) {
    console.error("Failed to connect to Redis:", err);
  }
})();

// Cache expiration time in seconds (e.g., 1 hour)
export const CACHE_TTL = 3600;

// Export the Redis client
export { redisClient };