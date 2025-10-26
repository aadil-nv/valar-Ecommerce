import { Types } from "mongoose";
import { Order } from "../models/order.model";
import { getProductCounts, getProductDetails } from "./productClient.service";
import { broadcastEvent } from "../index"; // Import from index.ts

export interface IProduct extends Document {
  _id: string;
  name: string;
  category: Types.ObjectId | ICategory;
  price: number;
  inventoryCount: number;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
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

  const data = {
    last24Hours: results[0][0] || { totalSales: 0, count: 0 },
    last7Days: results[1][0] || { totalSales: 0, count: 0 },
    last30Days: results[2][0] || { totalSales: 0, count: 0 },
  };

  // Broadcast directly via WebSocket
  await broadcastEvent("salesOverviewUpdate", data);

  return data;
};

export const getMonthlySalesService = async () => {
  const data = await Order.aggregate([
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        totalSales: { $sum: "$total" },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": -1, "_id.month": -1 } },
  ]);

  // Broadcast directly via WebSocket
  await broadcastEvent("monthlySalesUpdate", data);

  return data;
};

export const getYearlySalesService = async () => {
  const data = await Order.aggregate([
    {
      $group: {
        _id: { year: { $year: "$createdAt" } },
        totalSales: { $sum: "$total" },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": -1 } },
  ]);

  // Broadcast directly via WebSocket
  await broadcastEvent("yearlySalesUpdate", data);

  return data;
};

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
  const productDetails = await getProductDetails(productIds);

  const data = topProducts.map((p) => ({
    ...p,
    product: productDetails.find((d: IProduct) => d._id.toString() === p._id.toString()),
  }));

  // Broadcast directly via WebSocket
  await broadcastEvent("topProductsUpdate", data);

  return data;
};

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
  const allProducts = await getProductDetails();
  const unsold = allProducts.filter(
    (prod: IProduct) => !productIds.some((p) => p._id === prod._id)
  );

  const data = { lowSelling: productSales.slice(-10), unsoldProducts: unsold };

  // Broadcast directly via WebSocket
  await broadcastEvent("lowProductsUpdate", data);

  return data;
};

export const getOverallMetricsService = async () => {
  const [orderMetrics, productCounts] = await Promise.all([
    Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
          totalOrders: { $sum: 1 },
          customerIds: { $addToSet: "$customerId" },
        },
      },
      {
        $project: {
          totalRevenue: 1,
          totalOrders: 1,
          totalCustomers: { $size: "$customerIds" },
        },
      },
    ]),
    getProductCounts(),
  ]);

  const data = {
    totalRevenue: orderMetrics[0]?.totalRevenue || 0,
    totalOrders: orderMetrics[0]?.totalOrders || 0,
    totalCustomers: orderMetrics[0]?.totalCustomers || 0,
    totalProducts: productCounts.totalProducts || 0,
    listedProducts: productCounts.listedProducts || 0,
    unlistedProducts: productCounts.unlistedProducts || 0,
  };

  // Broadcast directly via WebSocket
  await broadcastEvent("overallMetricsUpdate", data);

  return data;
};