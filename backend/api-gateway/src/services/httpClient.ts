import axios, { AxiosRequestConfig } from "axios";

export const httpClient = async (method: string, url: string, data?: any, headers?: any) => {
  const config: AxiosRequestConfig = {
    method,
    url,
    data,
    headers
  };
  try {
    const response = await axios(config);
    return response.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Service unavailable" };
  }
};
