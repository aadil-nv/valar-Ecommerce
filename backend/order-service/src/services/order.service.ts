// src/services/order.service.ts
import { IOrder, Order } from "../models/order.model";
import { sendOrderFailedAlert } from "./alert.service";

export const createOrder = async (data: Partial<IOrder>): Promise<IOrder> => {
  const order = new Order(data);
  return order.save();
};

export const getOrders = async (): Promise<IOrder[]> => {
  return Order.find();
};

export const updateOrderStatus = async (orderId: string, status: string): Promise<IOrder | null> => {
  return Order.findByIdAndUpdate(orderId, { status }, { new: true });
};

export const markOrderAsFailed = async (orderId: string, customerId?: string) => {
  await Order.findByIdAndUpdate(orderId, { status: "failed" });
  
  // Send alert
  await sendOrderFailedAlert(orderId, customerId);
};
