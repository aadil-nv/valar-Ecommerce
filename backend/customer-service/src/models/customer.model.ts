import mongoose, { Schema, Document } from "mongoose";
import validator from "validator"; // Install validator: npm install validator

export interface Customer extends Document {
  customerName: string;
  email: string;
  isBlocked: boolean;
  phone?: string;
  deletedAt?: Date; // For soft delete
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<Customer>(
  {
    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
      minlength: [2, "Customer name must be at least 2 characters"],
      maxlength: [100, "Customer name must not exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (value: string) => validator.isEmail(value),
        message: "Invalid email format",
      },
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    phone: {
      type: String,
      trim: true,
      unique: true, // Make phone unique
      sparse: true, // Allows null/undefined but enforces uniqueness when set
      validate: {
        validator: (value: string) =>
          !value || validator.isMobilePhone(value, "any", { strictMode: false }),
        message: "Invalid phone number format",
      },
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for unique email and phone
customerSchema.index({ email: 1 }, { unique: true });
customerSchema.index({ phone: 1 }, { unique: true, sparse: true });

export const CustomerModel = mongoose.model<Customer>("Customer", customerSchema);