import { Request, Response, NextFunction } from "express";
import Joi from "joi";

// Validation schema for full customer data (POST/PUT)
export const customerSchema = Joi.object({
  customerName: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .required()
    .messages({
      "string.base": "Customer name must be a string",
      "string.empty": "Customer name is required",
      "string.min": "Customer name must be at least 2 characters",
      "string.max": "Customer name must not exceed 100 characters",
    }),
  email: Joi.string()
    .email()
    .lowercase()
    .trim()
    .required()
    .messages({
      "string.email": "Invalid email format",
      "string.empty": "Email is required",
    }),
  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional()
    .allow(null, "")
    .messages({
      "string.pattern.base": "Invalid phone number format",
    }),
  isBlocked: Joi.boolean()
    .optional()
    .default(false)
    .messages({
      "boolean.base": "isBlocked must be a boolean",
    }),
});

// Validation schema for PATCH isBlocked update
export const patchIsBlockedSchema = Joi.object({
  isBlocked: Joi.boolean()
    .required()
    .messages({
      "boolean.base": "isBlocked must be a boolean",
      "any.required": "isBlocked is required",
    }),
});

// Validation schema for query parameters
export const querySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      "number.base": "Page must be a number",
      "number.integer": "Page must be an integer",
      "number.min": "Page must be at least 1",
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      "number.base": "Limit must be a number",
      "number.integer": "Limit must be an integer",
      "number.min": "Limit must be at least 1",
      "number.max": "Limit must not exceed 100",
    }),
  search: Joi.string()
    .trim()
    .allow("")
    .optional()
    .messages({
      "string.base": "Search must be a string",
    }),
  sortBy: Joi.string()
    .valid("customerName", "email", "createdAt", "updatedAt", "isBlocked")
    .default("createdAt")
    .messages({
      "string.base": "sortBy must be a string",
      "any.only": "sortBy must be one of: customerName, email, createdAt, updatedAt, isBlocked",
    }),
  sortOrder: Joi.string()
    .valid("asc", "desc")
    .default("desc")
    .messages({
      "string.base": "sortOrder must be a string",
      "any.only": "sortOrder must be either 'asc' or 'desc'",
    }),
});

// Validation middleware for full customer data
export const validateCustomer = (req: Request, res: Response, next: NextFunction) => {
  const { error } = customerSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
    return res.status(400).json({ errors: errorMessages });
  }
  next();
};

// Validation middleware for PATCH isBlocked
export const validatePatchIsBlocked = (req: Request, res: Response, next: NextFunction) => {
  const { error } = patchIsBlockedSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
    return res.status(400).json({ errors: errorMessages });
  }
  next();
};

// Validation middleware for query parameters
export const validateQuery = (req: Request, res: Response, next: NextFunction) => {
  const { error } = querySchema.validate(req.query, { abortEarly: false });
  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
    return res.status(400).json({ errors: errorMessages });
  }
  next();
};