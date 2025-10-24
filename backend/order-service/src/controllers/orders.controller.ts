import { Request, Response, NextFunction } from "express";
import * as OrderService from "../services/order.service";
import { publishOrderEvent, OrderEventData } from "../queues/order.queue";
import { getProductDetails } from "../services/productClient.service";
import { generateOrderId } from "../utils/generateOrderId";
import { Types } from "mongoose";

interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}
export const createOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { items, customerId, total } = req.body;    
    console.log("caling created order is ",req.body);
    
    const productIds = items.map((item: OrderItem) => item.productId);    
    let products;
    try {
      products = await getProductDetails(productIds);
    } catch (err) {      
      return next(err);
    }

    if (!products || products.length !== productIds.length) {
      return res.status(400).json({ error: "One or more products are invalid" });
    }

    // Generate random orderId
    const orderId = generateOrderId();

    // Pass orderId to service
    const order = await OrderService.createOrder({ customerId, items, total, orderId });

    const orderEventData: OrderEventData = {
      _id:(order._id as Types.ObjectId).toString(),
      orderId: order.orderId,  // now using generated orderId
      customerId: order.customerId,
      total: order.total,
      items: order.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      })),
      status: order.status,
      createdAt: order.createdAt.toISOString(),
    };

    await publishOrderEvent("order_created", orderEventData);

    res.status(201).json(order);
  } catch (err: unknown) {
    next(err);
  }
};
export const getOrdersController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const orders = await OrderService.getOrders();
    res.json(orders);
  } catch (err) {
    next(err);
  }
};

export const updateOrderStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const order = await OrderService.updateOrderStatus(orderId, status);
    res.json(order);
  } catch (err) {
    next(err);
  }
};


export const getOrdersWithQueryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      page = "1",
      limit = "10",
      search = "",
      sortBy = "createdAt",
      sortOrder = "desc",
      status, // Removed default "pending" to allow undefined
    } = req.query;

    // Validate sortBy
    const validSortBy: OrderService.SortableOrderFields[] = ["orderId", "customerId", "total", "status", "createdAt"];
    const sortByKey = validSortBy.includes(sortBy as OrderService.SortableOrderFields)
      ? (sortBy as OrderService.SortableOrderFields)
      : "createdAt";

    // Validate sortOrder
    const sortOrderValue: OrderService.IQueryOptions["sortOrder"] = sortOrder === "asc" || sortOrder === "desc" ? sortOrder : "desc";

    // Validate status
    const validStatuses: OrderService.IQueryOptions["status"][] = ["pending", "shipped", "delivered", "cancelled"];
    const statusValue = status && validStatuses.includes(status as OrderService.IQueryOptions["status"])
      ? (status as OrderService.IQueryOptions["status"])
      : undefined;

    const paginatedOrders = await OrderService.getOrdersWithQuery({
      page: Number(page),
      limit: Number(limit),
      search: String(search),
      sortBy: sortByKey,
      sortOrder: sortOrderValue,
      status: statusValue,
    });

    res.json(paginatedOrders);
  } catch (err) {
    next(err);
  }
};


