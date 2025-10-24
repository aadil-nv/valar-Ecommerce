import { FilterQuery } from "mongoose";
import { IOrder, Order } from "../models/order.model";
import { sendOrderFailedAlert } from "./alert.service";
import RedisClient from "../config/redis"; // Adjust path to your Redis client config

export type SortableOrderFields = "orderId" | "customerId" | "total" | "status" | "createdAt";

export interface IQueryOptions {
  page: number;
  limit: number;
  search: string;
  sortBy: SortableOrderFields;
  sortOrder: "asc" | "desc";
  status?: "pending" | "shipped" | "delivered" | "cancelled";
}

const invalidateOrderCache = async () => {
  try {
    const keys = await RedisClient.keys("orders:*");
    if (keys.length > 0) {
      await RedisClient.del(keys);
      console.log(`Invalidated ${keys.length} order cache keys`);
    }
  } catch (err) {
    console.error("Failed to invalidate cache:", err);
  }
};

export const createOrder = async (data: Partial<IOrder>): Promise<IOrder> => {
    console.log("create order service is ==>",data);
    
  const order = new Order(data);
  const savedOrder = await order.save();
  await invalidateOrderCache();
  return savedOrder;
};

export const getOrders = async (): Promise<IOrder[]> => {
  const cacheKey = "orders:all";
  const startTime = performance.now();
  try {
    const cachedData = await RedisClient.get(cacheKey);
    if (cachedData) {
      console.log(`Cache hit for ${cacheKey}`);
      const endTime = performance.now();
      console.log(`getOrders (cache) took ${(endTime - startTime).toFixed(2)} ms`);
      return JSON.parse(cachedData);
    }
  } catch (err) {
    console.error("Redis error in getOrders:", err);
  }

  const orders = await Order.find();
  try {
    await RedisClient.setex(cacheKey, 300, JSON.stringify(orders));
  } catch (err) {
    console.error("Failed to cache orders:", err);
  }
  const endTime = performance.now();
  console.log(`getOrders (DB) took ${(endTime - startTime).toFixed(2)} ms`);
  return orders;
};

export const updateOrderStatus = async (orderId: string, status: string): Promise<IOrder | null> => {
  const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true });
  if (order) {
    await invalidateOrderCache();
  }
  return order;
};

export const markOrderAsFailed = async (orderId: string, customerId?: string) => {
  const order = await Order.findByIdAndUpdate(orderId, { status: "failed" }, { new: true });
  if (order) {
    await invalidateOrderCache();
    await sendOrderFailedAlert(orderId, customerId);
  }
};

export const getOrdersWithQuery = async (options: IQueryOptions) => {
  const { page, limit, search, sortBy, sortOrder, status } = options;
  const cacheKey = `orders:page:${page}:limit:${limit}:search:${search || ""}:sort:${sortBy}:${sortOrder}:status:${status || "all"}`;
  const startTime = performance.now();

  try {
    const cachedData = await RedisClient.get(cacheKey);
    if (cachedData) {
      console.log(`Cache hit for ${cacheKey}`);
      const endTime = performance.now();
      console.log(`getOrdersWithQuery (cache) took ${(endTime - startTime).toFixed(2)} ms`);
      return JSON.parse(cachedData);
    }
  } catch (err) {
    console.error("Redis error in getOrdersWithQuery:", err);
  }

  const query: FilterQuery<IOrder> = {};
  if (search) {
    query.$or = [
      { orderId: { $regex: search, $options: "i" } },
      { customerId: { $regex: search, $options: "i" } },
    ];
  }
  if (status) {
    query.status = status;
  }

  const [orders, total] = await Promise.all([
    Order.find(query)
      .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments(query),
  ]);

  const result = { data: orders, page, limit, total, totalPages: Math.ceil(total / limit) };

  try {
    await RedisClient.setex(cacheKey, 300, JSON.stringify(result));
  } catch (err) {
    console.error("Failed to cache orders with query:", err);
  }

  const endTime = performance.now();
  console.log(`getOrdersWithQuery (DB) took ${(endTime - startTime).toFixed(2)} ms`);
  return result;
};