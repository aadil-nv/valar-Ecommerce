// types.ts
export interface OrderEventData {
  _id: string;
  orderId: string;
  customerId: string;
  total: number;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  status: string;
  createdAt: string;
}

export interface SalesOverviewData {
  last24Hours: { totalSales: number; count: number };
  last7Days: { totalSales: number; count: number };
  last30Days: { totalSales: number; count: number };
}

export interface MonthlySalesData {
  _id: { year: number; month: number };
  totalSales: number;
  orderCount: number;
}

export interface TopProductData {
  _id: string;
  totalSold: number;
  totalRevenue: number;
  product: { name: string };
}

export interface LowProductsData {
  lowSelling: { _id: string; totalSold: number }[];
  unsoldProducts: { _id: string; name: string }[];
}

export interface OverallMetricsData {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  listedProducts: number;
  unlistedProducts: number;
}

export type EventData =
  | OrderEventData
  | SalesOverviewData
  | MonthlySalesData[]
  | TopProductData[]
  | LowProductsData
  | OverallMetricsData;

export interface EventMessage {
  event: string;
  data: EventData;
}