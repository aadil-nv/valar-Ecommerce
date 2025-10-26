import { Request, Response, NextFunction } from "express";
import * as OrderService from "../services/order.service";
import { broadcastEvent } from "../index"; // Import from index.ts
import {
  getSalesOverviewService,
  getMonthlySalesService,
  getTopProductsService,
  getLowProductsService,
  getOverallMetricsService,
} from "../services/sales.service";
import { getProductDetails } from "../services/productClient.service";
import { generateOrderId } from "../utils/generateOrderId";
import { Types } from "mongoose";

interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  inventoryCount: number;
  isDeleted: boolean;
}

export interface OrderEventData {
  _id: string;
  orderId: string;
  customerId: string;
  total: number;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  status: string;
  createdAt: string;
}

export const createOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { items, customerId, total } = req.body;
    console.log("Creating order with:", req.body);

    const productIds = items.map((item: OrderItem) => item.productId);
    let products: Product[];
    try {
      products = await getProductDetails(productIds);
    } catch (err) {
      return next(err);
    }

    if (!products || products.length !== productIds.length) {
      return res.status(400).json({ error: "One or more products are invalid" });
    }

    const quantityErrors: string[] = [];
    for (const item of items) {
      const product = products.find((p) => p._id === item.productId);
      if (!product) {
        return res.status(400).json({ error: `Product ${item.productId} not found` });
      }
      if (product.isDeleted) {
        return res.status(400).json({ error: `Product ${product.name} is not available` });
      }
      if (item.quantity > product.inventoryCount) {
        quantityErrors.push(
          `${product.name} (requested: ${item.quantity}, available: ${product.inventoryCount})`
        );
      }
    }

    if (quantityErrors.length > 0) {
      return res.status(400).json({
        error: `Insufficient inventory for: ${quantityErrors.join(", ")}`,
      });
    }

    const orderId = generateOrderId();
    const order = await OrderService.createOrder({ customerId, items, total, orderId });

    const orderEventData: OrderEventData = {
      _id: (order._id as Types.ObjectId).toString(),
      orderId: order.orderId,
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

    // Broadcast order creation event
    await broadcastEvent("order_created", orderEventData);

    // Trigger and broadcast sales metrics updates
     await Promise.all([
      getSalesOverviewService(),
      getMonthlySalesService(),
      getTopProductsService(),
      getLowProductsService(),
      getOverallMetricsService(),
    ]);

    // Since sales.service.ts already broadcasts these, we don't need to broadcast again here
    // Just ensure the services handle the broadcasting

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

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const orderEventData: OrderEventData = {
      _id: (order._id as Types.ObjectId).toString(),
      orderId: order.orderId,
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

    // Broadcast order status update event
    await broadcastEvent("order_status_updated", orderEventData);

    // Trigger and broadcast sales metrics updates
     await Promise.all([
      getSalesOverviewService(),
      getMonthlySalesService(),
      getTopProductsService(),
      getLowProductsService(),
      getOverallMetricsService(),
    ]);

    // Since sales.service.ts already broadcasts these, we don't need to broadcast again here

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
      status,
    } = req.query;

    const validSortBy: OrderService.SortableOrderFields[] = [
      "orderId",
      "customerId",
      "total",
      "status",
      "createdAt",
    ];
    const sortByKey = validSortBy.includes(sortBy as OrderService.SortableOrderFields)
      ? (sortBy as OrderService.SortableOrderFields)
      : "createdAt";

    const sortOrderValue: OrderService.IQueryOptions["sortOrder"] =
      sortOrder === "asc" || sortOrder === "desc" ? sortOrder : "desc";

    const validStatuses: OrderService.IQueryOptions["status"][] = [
      "pending",
      "shipped",
      "delivered",
      "cancelled",
    ];
    const statusValue =
      status && validStatuses.includes(status as OrderService.IQueryOptions["status"])
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