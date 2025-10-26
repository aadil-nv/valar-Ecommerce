import { CustomerModel, Customer } from "../models/customer.model";
import { redisClient, CACHE_TTL } from "../config/redis.config";

// Helper to generate cache key
const getCacheKey = (id: string) => `customer:${id}`;

// Helper to generate query cache key
const getQueryCacheKey = (params: { page: number; limit: number; search: string; sortBy: string; sortOrder: string }) =>
  `customers:query:${params.page}:${params.limit}:${params.search || ""}:${params.sortBy}:${params.sortOrder}`;

// Get all customers (with caching)
export const getAllCustomers = async (): Promise<Customer[]> => {
  const cacheKey = "customers:all";
  const cached = await redisClient.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const customers = await CustomerModel.find({ deletedAt: null }).exec();
  await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(customers));
  return customers;
};

// Get customer by ID (with caching)
export const getCustomerById = async (id: string): Promise<Customer | null> => {
  const cacheKey = getCacheKey(id);
  const cached = await redisClient.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const customer = await CustomerModel.findOne({ _id: id, deletedAt: null }).exec();
  if (customer) {
    await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(customer));
  }
  return customer;
};

// Create customer (invalidate all cache)
export const createCustomer = async (data: Partial<Customer>): Promise<Customer> => {
  const customer = new CustomerModel(data);
  await customer.save();
  await invalidateCaches();
  return customer;
};

// Update customer (invalidate caches)
export const updateCustomer = async (id: string, data: Partial<Customer>): Promise<Customer | null> => {
  const customer = await CustomerModel.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: data },
    { new: true, runValidators: true }
  ).exec();

  if (customer) {
    await invalidateCaches(id);
  }
  return customer;
};

// Soft delete customer (set deletedAt, invalidate caches)
export const softDeleteCustomer = async (id: string): Promise<Customer | null> => {
  const customer = await CustomerModel.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: { deletedAt: new Date() } },
    { new: true }
  ).exec();

  if (customer) {
    await invalidateCaches(id);
  }
  return customer;
};

// Patch isBlocked (invalidate caches)
export const patchIsBlocked = async (id: string, isBlocked: boolean): Promise<Customer | null> => {
  const customer = await CustomerModel.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: { isBlocked } },
    { new: true }
  ).exec();

  if (customer) {
    await invalidateCaches(id);
  }
  return customer;
};

// Query customers with pagination, search, and sorting (with caching)
export const queryCustomers = async (
  page: number = 1,
  limit: number = 10,
  search: string = "",
  sortBy: string = "createdAt",
  sortOrder: "asc" | "desc" = "desc"
): Promise<{ customers: Customer[]; total: number; page: number; totalPages: number }> => {
  const cacheKey = getQueryCacheKey({ page, limit, search, sortBy, sortOrder });
  const cached = await redisClient.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const query: any = { deletedAt: null };
  if (search) {
    query.$or = [
      { customerName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const sort: any = {};
  sort[sortBy] = sortOrder === "asc" ? 1 : -1;

  const [customers, total] = await Promise.all([
    CustomerModel.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec(),
    CustomerModel.countDocuments(query).exec(),
  ]);

  const result = {
    customers,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };

  await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(result));
  return result;
};

export const patchCustomer = async (
  id: string,
  data: Partial<Customer>
): Promise<Customer | null> => {
  const customer = await CustomerModel.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: data },
    { new: true, runValidators: true }
  ).exec();

  if (customer) {
    await invalidateCaches(id);
  }
  return customer;
};

// Invalidate caches (all, specific, and query caches)
const invalidateCaches = async (id?: string) => {
  await redisClient.del("customers:all");
  const keys = await redisClient.keys("customers:query:*");
  if (keys.length) {
    await redisClient.del(keys);
  }
  if (id) {
    await redisClient.del(getCacheKey(id));
  }
};