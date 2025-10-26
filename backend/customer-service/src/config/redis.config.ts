import { createClient } from "redis"; 

const redisClient = createClient({
  url: process.env.REDIS_URL as string, 
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

(async () => {
  try {
    await redisClient.connect();
    console.log("Connected to Redis");
  } catch (err) {
    console.error("Failed to connect to Redis:", err);
  }
})();

export const CACHE_TTL = 3600;

export { redisClient };