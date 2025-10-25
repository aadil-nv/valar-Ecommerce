import { Request, Response, NextFunction } from "express";
import * as OrderService from "../services/order.service";
import {
  publishEvent,
  OrderEventData,
} from "../queues/order.queue";
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
  // Add other product fields as needed
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

    // Validate product quantities and collect errors
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

    // If there are quantity errors, return a combined error message
    if (quantityErrors.length > 0) {
      return res.status(400).json({
        error: `Insufficient inventory for: ${quantityErrors.join(", ")}`,
      });
    }

    // Generate random orderId
    const orderId = generateOrderId();

    // Pass orderId to service
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

    // Publish order creation event
    await publishEvent("order_created", orderEventData);

    // Trigger sales metrics updates
    await Promise.all([
      getSalesOverviewService(),
      getMonthlySalesService(),
      getTopProductsService(),
      getLowProductsService(),
      getOverallMetricsService(),
    ]);

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

    // Check if order exists
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

    // Publish order status update event
    await publishEvent("order_status_updated", orderEventData);

    // Trigger sales metrics updates (if status change affects metrics)
    await Promise.all([
      getSalesOverviewService(),
      getMonthlySalesService(),
      getTopProductsService(),
      getLowProductsService(),
      getOverallMetricsService(),
    ]);

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

    // Validate sortBy
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

    // Validate sortOrder
    const sortOrderValue: OrderService.IQueryOptions["sortOrder"] =
      sortOrder === "asc" || sortOrder === "desc" ? sortOrder : "desc";

    // Validate status
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