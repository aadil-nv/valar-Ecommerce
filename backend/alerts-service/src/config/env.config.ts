import dotenv from "dotenv";
dotenv.config();

export const config = {
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI ,
  RABBITMQ_URI: process.env.RABBITMQ_URI,
  ALERT_QUEUE_NAME :process.env.ALERT_QUEUE_NAME  
};
