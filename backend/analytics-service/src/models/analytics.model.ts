import mongoose, { Schema, Document } from "mongoose";

export interface IAnalytics extends Document {
  orderId?: string;
  productId?: string;
  type: string; // "order_created", "product_created", "inventory_updated"
  value: number;
  timestamp: Date;
}

const analyticsSchema = new Schema<IAnalytics>({
  orderId: { type: String },
  productId: { type: String },
  type: { type: String, required: true },
  value: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

export const Analytics = mongoose.model<IAnalytics>("Analytics", analyticsSchema);
