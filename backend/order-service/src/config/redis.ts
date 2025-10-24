import Redis from "ioredis";
import { config } from "./env.config";

export const RedisClient = new Redis({
  host: config.REDIS_HOST,
  port: parseInt(config.REDIS_PORT as string),
});

RedisClient.on("error", (err) => console.error("Redis Client Error:", err));

export default RedisClient;