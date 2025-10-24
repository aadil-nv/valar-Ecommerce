import { Types } from "mongoose";
import { Product, IProduct } from "../models/product.model";
import { sendInventoryAlert } from "./alert.service";

export const createProduct = async (data: Partial<IProduct>) => {
  const product = new Product(data);
  await product.save();
  return product;
};

export const getProducts = async () => {
  return await Product.find({ isDeleted: false })
    .sort({ createdAt: -1 })
    .populate("category");
};

export const updateProduct = async (productId: string, data: Partial<IProduct>) => {
  return await Product.findByIdAndUpdate(productId, data, { new: true });
};

export const updateInventory = async (productId: string, count: number) => {
  return await Product.findByIdAndUpdate(productId, { inventoryCount: count }, { new: true });
};


export const decreaseStock = async (productId: string, quantity: number) => {    
  const product = await Product.findById(productId);
  if (!product) throw new Error("Product not found");
  if (product.inventoryCount < quantity) throw new Error("Not enough inventory");

  product.inventoryCount -= quantity;
  await product.save();

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

  return result;
};

export const getProductsByIdsService = async (productIds: string[]) => {
  const validIds = productIds.filter((id) => Types.ObjectId.isValid(id));
  if (!validIds.length) return [];

  const products = await Product.find({
    _id: { $in: validIds },
    isDeleted: { $ne: true }, // exclude soft-deleted products
  });

  return products;
};

export const getPaginatedProducts = async (page: number, limit: number) => {
  const skip = (page - 1) * limit;
  const [products, total] = await Promise.all([
    Product.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("category"),
    Product.countDocuments({ isDeleted: false }),
  ]);
  return { products, total };
};