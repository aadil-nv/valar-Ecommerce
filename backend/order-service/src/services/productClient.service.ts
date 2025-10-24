import axios from "axios";
import { config } from "../config/env.config";

export const getProductDetails = async (productIds?: string[]) => {
  const url = productIds && productIds.length
    ? `${config.PRODUCT_SERVICE_URL}/api/products/bulk?ids=${productIds.join(",")}` // query string
    : `${config.PRODUCT_SERVICE_URL}/api/products`; // get all products if no ids

  const { data } = await axios.get(url);
  return data;
};
