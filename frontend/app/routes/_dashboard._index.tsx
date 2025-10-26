// DashboardHome.tsx
import { useState, useEffect } from "react";
import axios from "axios";
import { Bar, Line, Pie } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from "chart.js";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const WS_URL = import.meta.env.VITE_WS_URL as string
console.log("dashbord url is ==>",WS_URL);


interface OverallMetrics {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  listedProducts: number;
  unlistedProducts: number;
}

interface OverviewData {
  last24Hours: { totalSales: number; count: number };
  last7Days: { totalSales: number; count: number };
  last30Days: { totalSales: number; count: number };
}

interface MonthlyData {
  _id: { year: number; month: number };
  totalSales: number;
  orderCount: number;
}

interface TopProduct {
  _id: string;
  totalSold: number;
  totalRevenue: number;
  product: { name: string };
}

interface LowProducts {
  lowSelling: { _id: string; totalSold: number }[];
  unsoldProducts: { _id: string; name: string }[];
}

interface WebSocketMessage {
  event: string;
  data:
    | OverallMetrics
    | OverviewData
    | MonthlyData[]
    | TopProduct[]
    | LowProducts;
}

export default function DashboardHome() {
  const [overall, setOverall] = useState<OverallMetrics | null>(null);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [monthly, setMonthly] = useState<MonthlyData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [lowProducts, setLowProducts] = useState<LowProducts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initial data fetch
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [overallRes, overviewRes, monthlyRes, topRes, lowRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/sales/overall`),
          axios.get(`${API_BASE_URL}/sales/overview`),
          axios.get(`${API_BASE_URL}/sales/monthly`),
          axios.get(`${API_BASE_URL}/sales/top-products`),
          axios.get(`${API_BASE_URL}/sales/low-products`),
        ]);

        setOverall(overallRes.data);
        setOverview(overviewRes.data);
        setMonthly(monthlyRes.data);
        setTopProducts(topRes.data);
        setLowProducts(lowRes.data);
      } catch (err) {
        setError("Failed to fetch analytics data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // WebSocket connection with reconnection logic
    let ws: WebSocket | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectInterval = 5000; // 5 seconds

    const connectWebSocket = () => {
      ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log("Dashborad Connected to WebSocket server");
        setError(null); // Clear any previous WebSocket errors
        reconnectAttempts = 0; // Reset reconnect attempts
      };

      ws.onmessage = (event: MessageEvent) => {
        console.log("Dashbprd event ===> ",event);
        
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          switch (message.event) {
            case "overallMetricsUpdate":
              setOverall(message.data as OverallMetrics);
              break;
            case "salesOverviewUpdate":
              setOverview(message.data as OverviewData);
              break;
            case "monthlySalesUpdate":
              setMonthly(message.data as MonthlyData[]);
              break;
            case "topProductsUpdate":
              setTopProducts(message.data as TopProduct[]);
              break;
            case "lowProductsUpdate":
              setLowProducts(message.data as LowProducts);
              break;
            default:
              console.warn("Unknown WebSocket event:", message.event);
          }
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setError(`WebSocket connection failed: ${WS_URL}`);
      };

      ws.onclose = () => {
        console.log("WebSocket connection closed");
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          console.log(`Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`);
          setTimeout(connectWebSocket, reconnectInterval);
        } else {
          setError("Max WebSocket reconnection attempts reached");
        }
      };
    };

    connectWebSocket();

    // Cleanup WebSocket on component unmount
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  // ... (rest of the component remains unchanged)
  // Overview Bar Chart Data
  const overviewChartData = {
    labels: ["Last 24 Hours", "Last 7 Days", "Last 30 Days"],
    datasets: [
      {
        label: "Total Sales ($)",
        data: overview
          ? [overview.last24Hours.totalSales, overview.last7Days.totalSales, overview.last30Days.totalSales]
          : [0, 0, 0],
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
      },
      {
        label: "Order Count",
        data: overview
          ? [overview.last24Hours.count, overview.last7Days.count, overview.last30Days.count]
          : [0, 0, 0],
        backgroundColor: "rgba(16, 185, 129, 0.5)",
        borderColor: "rgba(16, 185, 129, 1)",
        borderWidth: 1,
      },
    ],
  };

  // Monthly Line Chart Data
  const monthlyChartData = {
    labels: monthly.map((m) => `${m._id.month}/${m._id.year}`),
    datasets: [
      {
        label: "Total Sales ($)",
        data: monthly.map((m) => m.totalSales),
        fill: false,
        borderColor: "rgba(59, 130, 246, 1)",
        tension: 0.1,
      },
      {
        label: "Order Count",
        data: monthly.map((m) => m.orderCount),
        fill: false,
        borderColor: "rgba(16, 185, 129, 1)",
        tension: 0.1,
      },
    ],
  };

  // Top Products Bar Chart Data
  const topProductsChartData = {
    labels: topProducts.map((p) => p.product.name),
    datasets: [
      {
        label: "Units Sold",
        data: topProducts.map((p) => p.totalSold),
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
      },
    ],
  };

  // Unsold Products Pie Chart Data
  const unsoldProductsChartData = {
    labels: lowProducts?.unsoldProducts.map((p) => p.name) || [],
    datasets: [
      {
        label: "Unsold Products",
        data: lowProducts?.unsoldProducts.map(() => 1) || [],
        backgroundColor: [
          "rgba(255, 99, 132, 0.5)",
          "rgba(54, 162, 235, 0.5)",
          "rgba(255, 206, 86, 0.5)",
          "rgba(75, 192, 192, 0.5)",
          "rgba(153, 102, 255, 0.5)",
          "rgba(255, 159, 64, 0.5)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-lg m-4">
        {error}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Analytics Dashboard</h2>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: "Total Revenue", value: `$${overall?.totalRevenue.toLocaleString() || 0}` },
          { label: "Total Orders", value: overall?.totalOrders.toLocaleString() || 0 },
          { label: "Total Customers", value: overall?.totalCustomers.toLocaleString() || 0 },
          { label: "Total Products", value: overall?.totalProducts.toLocaleString() || 0 },
          { label: "Listed Products", value: overall?.listedProducts.toLocaleString() || 0 },
          { label: "Unlisted Products", value: overall?.unlistedProducts.toLocaleString() || 0 },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <div className="text-sm text-gray-600">{stat.label}</div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 mt-2">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overview Bar Chart */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Sales Overview</h3>
          <div className="h-64 sm:h-80">
            <Bar
              data={overviewChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: { beginAtZero: true },
                },
                plugins: { legend: { position: "top" } },
              }}
            />
          </div>
        </div>

        {/* Monthly Line Chart */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Sales</h3>
          <div className="h-64 sm:h-80">
            <Line
              data={monthlyChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: { beginAtZero: true },
                  x: { ticks: { maxRotation: 45, minRotation: 45 } },
                },
                plugins: { legend: { position: "top" } },
              }}
            />
          </div>
        </div>

        {/* Top Products Bar Chart */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Selling Products</h3>
          <div className="h-64 sm:h-80">
            <Bar
              data={topProductsChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: { beginAtZero: true },
                  x: { ticks: { maxRotation: 45, minRotation: 45 } },
                },
                plugins: { legend: { position: "top" } },
              }}
            />
          </div>
        </div>

        {/* Unsold Products Pie Chart */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Unsold Products</h3>
          <div className="h-64 sm:h-80">
            <Pie
              data={unsoldProductsChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "right" } },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}