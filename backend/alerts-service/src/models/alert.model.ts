import mongoose, { Schema, Document } from "mongoose";

export interface IAlert extends Document {
  type: "low"| "medium"| "high"| "critical" | string; 
  message: string;
  status: "pending" | "sent" | "failed";
  resolved:boolean
  createdAt: Date;
  updatedAt: Date;
}

const alertSchema = new Schema<IAlert>(
  {
    type: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, default: "pending" },
    resolved: {type:Boolean ,default:false}
  },
  { timestamps: true }
);

export const Alert = mongoose.model<IAlert>("Alert", alertSchema);
