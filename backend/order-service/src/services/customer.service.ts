
import axios from "axios";
import { config } from "../config/env.config";

export const getCustomers = async () => {
  const url = `${config.CUSTOMER_SERVICE_URL}/api/customer`;
  const { data } = await axios.get(url);
  return data;
};