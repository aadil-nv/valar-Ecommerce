import { Schema, model, Document, Types } from "mongoose";

export interface IOrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface IOrder extends Document<Types.ObjectId> {
  _id: Types.ObjectId; // default MongoDB ID
  orderId: string;     // new explicit orderId
  customerId: string;
  total: number;
  items: IOrderItem[];
  status: "pending" | "shipped" | "delivered" | "cancelled";
  createdAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  productId: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
});

const OrderSchema = new Schema<IOrder>({
  orderId: { type: String, required: true, unique: true }, // new field
  customerId: { type: String, required: true },
  total: { type: Number, required: true },
  items: { type: [OrderItemSchema], required: true },
  status: { type: String, required: true, default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

export const Order = model<IOrder>("Order", OrderSchema);
