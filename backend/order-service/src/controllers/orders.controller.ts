import { Request, Response, NextFunction } from "express";
import * as OrderService from "../services/order.service";
import { publishOrderEvent, OrderEventData } from "../queues/order.queue";
import { Types } from "mongoose";
import { getProductDetails } from "../services/productClient.service";

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
    const productIds = items.map((item:OrderItem) => item.productId);    
    let products;
    try {
      products = await getProductDetails(productIds);
      
    } catch (err) {      
      next(err)
    }

    if (!products || products.length !== productIds.length) {
      return res.status(400).json({ error: "One or more products are invalid" });
    }

    const order = await OrderService.createOrder({ customerId, items, total });

    const orderEventData: OrderEventData = {
      orderId: (order._id as Types.ObjectId).toString(),
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
