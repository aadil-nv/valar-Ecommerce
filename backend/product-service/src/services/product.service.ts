import { Types } from "mongoose";
import { Product, IProduct } from "../models/product.model";
import { sendInventoryAlert } from "./alert.service";
import { RedisClient } from "../config/redis";

export const createProduct = async (data: Partial<IProduct>) => {
  const product = new Product(data);
  await product.save();

  // Invalidate paginated cache on product creation
  await invalidatePaginatedCache();

  return product;
};

export const getProducts = async () => {
  return await Product.find()
    .select("name category price inventoryCount createdAt updatedAt isDeleted")
    .sort({ createdAt: -1 })
    .populate("category", "name");
};

export const getPaginatedProducts = async (page: number, limit: number) => {
  const startTime = performance.now(); // Log start time

  const cacheKey = `products:page:${page}:limit:${limit}`;
  const cachedData = await RedisClient.get(cacheKey); // Check cache

  if (cachedData) {
    console.log(`Cache hit for ${cacheKey}`);
    const endTime = performance.now();
    console.log(`getPaginatedProducts (cache) took ${(endTime - startTime).toFixed(2)} ms`);
    return JSON.parse(cachedData);
  }

  const skip = (page - 1) * limit;
  const [products, total] = await Promise.all([
    Product.find()
      .select("name category price inventoryCount createdAt updatedAt isDeleted")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("category", "name"),
    Product.countDocuments(),
  ]);

  const result = { products, total };

  // Cache the result for 5 minutes
  await RedisClient.setex(cacheKey, 300, JSON.stringify(result));

  const endTime = performance.now();
  console.log(`getPaginatedProducts (DB) took ${(endTime - startTime).toFixed(2)} ms`);

  return result;
};

export const updateProduct = async (productId: string, data: Partial<IProduct>) => {
  const product = await Product.findByIdAndUpdate(productId, data, { new: true })
    .select("name category price inventoryCount createdAt updatedAt isDeleted")
    .populate("category", "name");

  // Invalidate paginated cache on product update
  if (product) {
    await invalidatePaginatedCache();
  }

  return product;
};

export const updateInventory = async (productId: string, count: number) => {
  const product = await Product.findByIdAndUpdate(
    productId,
    { inventoryCount: count },
    { new: true }
  )
    .select("name category price inventoryCount createdAt updatedAt isDeleted")
    .populate("category", "name");

  // Invalidate paginated cache on inventory update
  if (product) {
    await invalidatePaginatedCache();
  }

  return product;
};

export const decreaseStock = async (productId: string, quantity: number) => {    
  const product = await Product.findById(productId);
  if (!product) throw new Error("Product not found");
  if (product.inventoryCount < quantity) throw new Error("Not enough inventory");

  product.inventoryCount -= quantity;
  await product.save();

  // Invalidate paginated cache on stock decrease
  await invalidatePaginatedCache();

  // Send alert if inventory below 10
  if (product.inventoryCount < 10) {
    sendInventoryAlert(product); // fire-and-forget
  }

  return product;
};

export const bulkSoftDeleteProducts = async (productIds: string[]) => {    
  const objectIds = productIds.map((id) => new Types.ObjectId(id));

  const result = await Product.updateMany(
    { _id: { $in: objectIds }, isDeleted: false },
    { isDeleted: true, deletedAt: new Date() }
  );

  // Invalidate paginated cache on bulk delete
  await invalidatePaginatedCache();

  return result;
};

export const softDeleteProduct = async (productId: string) => {
  if (!Types.ObjectId.isValid(productId)) {
    throw new Error("Invalid product ID");
  }
  const result = await Product.findByIdAndUpdate(
    productId,
    { isDeleted: true, deletedAt: new Date() },
    { new: true }
  );

  // Invalidate paginated cache on single delete
  if (result) {
    await invalidatePaginatedCache();
  }

  return result;
};

export const getProductsByIdsService = async (productIds: string[]) => {
  const validIds = productIds.filter((id) => Types.ObjectId.isValid(id));
  if (!validIds.length) return [];

  const products = await Product.find({
    _id: { $in: validIds },
    isDeleted: { $ne: true },
  })
    .select("name category price inventoryCount createdAt updatedAt isDeleted")
    .populate("category", "name");

  return products;
};

// Helper function to invalidate paginated cache
const invalidatePaginatedCache = async () => {
  const keys = await RedisClient.keys("products:page:*:limit:*");
  if (keys.length > 0) {
    await RedisClient.del(keys);
    console.log(`Invalidated ${keys.length} paginated cache keys`);
  }
};