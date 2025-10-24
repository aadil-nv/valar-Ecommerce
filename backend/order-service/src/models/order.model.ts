import { Schema, model, Document, Types } from "mongoose";

export interface IOrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface IOrder extends Document<Types.ObjectId> {
  _id: Types.ObjectId; // explicitly type _id
  customerId: string;
  total: number;
  items: IOrderItem[];
  status: string;
  createdAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  productId: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
});

const OrderSchema = new Schema<IOrder>({
  customerId: { type: String, required: true },
  total: { type: Number, required: true },
  items: { type: [OrderItemSchema], required: true },
  status: { type: String, required: true, default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

export const Order = model<IOrder>("Order", OrderSchema);
