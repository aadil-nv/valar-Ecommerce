import { Types } from "mongoose";
import { Order } from "../models/order.model";
import { getProductDetails } from "./productClient.service";

export interface IProduct extends Document {
  _id:string
  name: string;
  category: Types.ObjectId | ICategory;
  price: number;
  inventoryCount: number;
  createdAt: Date;
  updatedAt: Date;
  isDeleted:boolean
}
export interface ICategory extends Document {
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
export const getSalesOverviewService = async () => {
  const now = new Date();

  const timeFrames = {
    last24h: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    last7d: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    last30d: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
  };

  const results = await Promise.all([
    Order.aggregate([
      { $match: { createdAt: { $gte: timeFrames.last24h } } },
      { $group: { _id: null, totalSales: { $sum: "$total" }, count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: timeFrames.last7d } } },
      { $group: { _id: null, totalSales: { $sum: "$total" }, count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: timeFrames.last30d } } },
      { $group: { _id: null, totalSales: { $sum: "$total" }, count: { $sum: 1 } } },
    ]),
  ]);

  return {
    last24Hours: results[0][0] || { totalSales: 0, count: 0 },
    last7Days: results[1][0] || { totalSales: 0, count: 0 },
    last30Days: results[2][0] || { totalSales: 0, count: 0 },
  };
};

// 📅 Monthly Sales
export const getMonthlySalesService = async () => {
  return await Order.aggregate([
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        totalSales: { $sum: "$total" },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": -1, "_id.month": -1 } },
  ]);
};

// 📆 Yearly Sales
export const getYearlySalesService = async () => {
  return await Order.aggregate([
    {
      $group: {
        _id: { year: { $year: "$createdAt" } },
        totalSales: { $sum: "$total" },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": -1 } },
  ]);
};

// 🥇 Top-selling Products
export const getTopProductsService = async () => {
  const topProducts = await Order.aggregate([
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.productId",
        totalSold: { $sum: "$items.quantity" },
        totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
      },
    },
    { $sort: { totalSold: -1 } },
    { $limit: 10 },
  ]);

  const productIds = topProducts.map((p) => p._id);
  console.log("product ids ===>",productIds);
  
  const productDetails = await getProductDetails(productIds);

  return topProducts.map((p) => ({
    ...p,
    product: productDetails.find((d:IProduct) => d._id.toString() === p._id.toString()),
  }));
};

// 🧊 Low-selling (Not Moving) Products
export const getLowProductsService = async () => {
  const productSales = await Order.aggregate([
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.productId",
        totalSold: { $sum: "$items.quantity" },
      },
    },
  ]);

  const productIds = productSales.map((p) => p._id);
  const allProducts = await getProductDetails(); // Fetch all active products
  const unsold = allProducts.filter(
    (prod:IProduct) => !productIds.some((p) => p._id === prod._id)
  );

  return { lowSelling: productSales.slice(-10), unsoldProducts: unsold };
};
