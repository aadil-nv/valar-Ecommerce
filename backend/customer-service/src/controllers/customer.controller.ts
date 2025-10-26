import { Request, Response, NextFunction } from "express";
import * as CustomerService from "../services/customer.service";

export const getAllCustomersController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customers = await CustomerService.getAllCustomers();
    res.json(customers);
  } catch (err) {
    next(err);
  }
};

export const getCustomerByIdController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await CustomerService.getCustomerById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json(customer);
  } catch (err) {
    next(err);
  }
};

export const createCustomerController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await CustomerService.createCustomer(req.body);
    res.status(201).json(customer);
  } catch (err) {
    next(err);
  }
};

export const updateCustomerController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await CustomerService.updateCustomer(req.params.id, req.body);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json(customer);
  } catch (err) {
    next(err);
  }
};

export const softDeleteCustomerController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await CustomerService.softDeleteCustomer(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json({ message: "Customer soft deleted successfully" });
  } catch (err) {
    next(err);
  }
};

export const patchIsBlockedController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await CustomerService.patchIsBlocked(req.params.id, req.body.isBlocked);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json(customer);
  } catch (err) {
    next(err);
  }
};

export const queryCustomersController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, search, sortBy, sortOrder } = req.query as {
      page?: string;
      limit?: string;
      search?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    };
    const result = await CustomerService.queryCustomers(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      search || "",
      sortBy || "createdAt",
      sortOrder || "desc"
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const patchCustomerController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const allowedFields = ["customerName", "email"];
    const updates = Object.keys(req.body);
    const isValidUpdate = updates.every((field) => allowedFields.includes(field));

    if (!isValidUpdate || updates.length === 0) {
      return res.status(400).json({
        message: `Invalid fields. Allowed: ${allowedFields.join(", ")}`,
      });
    }

    const customer = await CustomerService.patchCustomer(req.params.id, req.body);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json(customer);
  } catch (err) {
    next(err);
  }
};