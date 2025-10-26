import dotenv from "dotenv";
dotenv.config();

console.log("PRT is ==>",process.env.PORT);

export const config = {
  PORT: process.env.PORT,
  ORDER_SERVICE_URL: process.env.ORDER_SERVICE_URL ,
  PRODUCT_SERVICE_URL: process.env.PRODUCT_SERVICE_URL ,
  CUSTOMER_SERVICE_URL: process.env.CUSTOMER_SERVICE_URL ,
  ALERTS_SERVICE_URL: process.env.ALERTS_SERVICE_URL
};
