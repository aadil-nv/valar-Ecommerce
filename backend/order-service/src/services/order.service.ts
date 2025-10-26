import { FilterQuery } from "mongoose";
import { IOrder, Order } from "../models/order.model";
import { sendOrderFailedAlert } from "./alert.service";
import RedisClient from "../config/redis"; // Adjust path to your Redis client config
import { publishEvent } from "../queues/order.queue"; // Import from order.queue.ts
import { decreaseProductStock } from "../services/productClient.service";
import { getCustomers } from "./customer.service";

export type SortableOrderFields = "orderId" | "customerId" | "total" | "status" | "createdAt";

export interface IQueryOptions {
  page: number;
  limit: number;
  search: string;
  sortBy: SortableOrderFields;
  sortOrder: "asc" | "desc";
  status?: "pending" | "shipped" | "delivered" | "cancelled";
}

// Define interface for order items to match OrderEventData
interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

// Define interface for event data
interface OrderEventData {
  _id: string;
  orderId: string;
  customerId: string;
  total: number;
  items: OrderItem[];
  status: string;
  createdAt: string;
}

export interface Customer  {
    _id:string
  customerName: string;
  email: string;
  isBlocked: boolean;
  phone?: string;
  deletedAt?: Date; // For soft delete
  createdAt: Date;
  updatedAt: Date;
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
  console.log("create order service is ==>", data);

  // Validate items
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    throw new Error("Order must include a non-empty array of items");
  }

  // Start a transaction to ensure atomicity
  const session = await Order.startSession();
  session.startTransaction();

  let savedOrder: IOrder | null = null; // Declare savedOrder outside try block

  try {
    // Create the order
    const order = new Order(data);
    savedOrder = await order.save({ session });

    // Decrease stock for each item
    for (const item of data.items as OrderItem[]) {
      if (!item.productId || !Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new Error(`Invalid item data: productId=${item.productId}, quantity=${item.quantity}`);
      }
      try {
        await decreaseProductStock(item.productId, item.quantity);
      } catch (stockError) {
        console.error(`Failed to decrease stock for product ${item.productId}:`, stockError);
        throw new Error(`Stock update failed for product ${item.productId}: ${(stockError as Error).message}`);
      }
    }

    // Publish order_created event
    const eventData: OrderEventData = {
      _id: savedOrder._id.toString(),
      orderId: savedOrder.orderId,
      customerId: savedOrder.customerId,
      total: savedOrder.total,
      items: savedOrder.items as OrderItem[],
      status: savedOrder.status,
      createdAt: savedOrder.createdAt.toISOString(),
    };

    await publishEvent("order_created", eventData);
    console.log(`Published order_created event for order ${savedOrder.orderId}`);

    // Commit the transaction
    await session.commitTransaction();

    // Invalidate cache
    await invalidateOrderCache();

    return savedOrder;
  } catch (error: unknown) {
    // Handle error as Error type
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    // Abort the transaction
    await session.abortTransaction();

    // Mark order as failed if it was saved
    if (savedOrder) {
      await markOrderAsFailed(savedOrder._id.toString(), savedOrder.customerId);
    }

    console.error("Order creation failed:", errorMessage);
    throw new Error(errorMessage);
  } finally {
    session.endSession();
  }
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

  try {
    // Fetch all customers
    const customers = await getCustomers();
    
    const customerMap = new Map(customers.map((c:Customer) => [c._id, c.customerName]));

    // Fetch orders
    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments(query),
    ]);

    // Enrich orders with customerName
    const enrichedOrders = orders.map((order) => ({
      ...order,
      customerName: customerMap.get(order.customerId) || "Unknown Customer",
    }));

    const result = {
      data: enrichedOrders,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };

    try {
      await RedisClient.setex(cacheKey, 300, JSON.stringify(result));
    } catch (err) {
      console.error("Failed to cache orders with query:", err);
    }

    const endTime = performance.now();
    console.log(`getOrdersWithQuery (DB) took ${(endTime - startTime).toFixed(2)} ms`);

    
    return result;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to fetch orders or customers";
    console.error("Error in getOrdersWithQuery:", errorMessage);
    throw new Error(errorMessage);
  }
};