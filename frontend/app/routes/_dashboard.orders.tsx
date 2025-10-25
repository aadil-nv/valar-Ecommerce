import { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";
import { Plus, Save, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Alert from "../components/Alert";
import AddOrderModal from "../components/AddOrderModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface IOrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface IOrder {
  _id: string;
  orderId: string;
  customerId: string;
  total: number;
  items: IOrderItem[];
  status: "pending" | "shipped" | "delivered" | "cancelled";
  createdAt: Date;
}

type SortKey = "orderId" | "customerId" | "total" | "status" | "createdAt";
type SortOrder = "asc" | "desc";

// Define error response shape for Axios errors
interface ErrorResponse {
  error?: { error: string }; // Updated to handle nested error object
}

export default function Orders() {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<IOrder[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newOrder, setNewOrder] = useState({
    orderId: "",
    customerId: "",
    total: 0,
    items: [{ productId: "", quantity: 0, price: 0 }],
    status: "pending" as IOrder["status"],
  });
  const [editingStatus, setEditingStatus] = useState<{ [key: string]: IOrder["status"] | undefined }>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [alert, setAlert] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | IOrder["status"]>("all");
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: SortOrder }>({ key: "createdAt", order: "desc" });
  const itemsPerPage = 5;
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
          search: searchTerm,
          sortBy: sortConfig.key,
          sortOrder: sortConfig.order,
          ...(statusFilter !== "all" && { status: statusFilter }),
        });
        const { data: { data, total } } = await axios.get(`${API_BASE_URL}/orders/query?${params}`);
        setOrders(data);
        setFilteredOrders(data);
        setTotalPages(Math.ceil(total / itemsPerPage));
      } catch (err) {
        const errorMessage = (err as AxiosError<ErrorResponse>).response?.data?.error?.error || "Failed to fetch orders";
        toast.error(errorMessage);
        // setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [currentPage, searchTerm, statusFilter, sortConfig]);

  const handleAddOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert({
      message: "Are you sure you want to add this order?",
      onConfirm: async () => {
        try {
          console.log("new order is ==>", newOrder);
          const { data } = await axios.post(`${API_BASE_URL}/orders`, newOrder);
          console.log("Data is ==>", data);
          
          setOrders([...orders, data]);
          setIsModalOpen(false);
          setNewOrder({ orderId: "", customerId: "", total: 0, items: [{ productId: "", quantity: 0, price: 0 }], status: "pending" });
          setAlert(null);
          toast.success("Order added successfully");
        } catch (err) {
          const errorMessage = (err as AxiosError<ErrorResponse>).response?.data?.error?.error || "Failed to add order";
          console.error("Error from ==>", err);
          toast.error(errorMessage);
        //   setError(errorMessage);
          setAlert(null);
        }
      },
    });
  };

  const handleStatusEdit = (orderId: string, status: IOrder["status"]) => {
    setEditingStatus({ ...editingStatus, [orderId]: status });
  };

  const handleStatusSave = async (orderId: string) => {
    const newStatus = editingStatus[orderId];
    if (!newStatus) return;
    setAlert({
      message: `Are you sure you want to update this order's status to ${newStatus}?`,
      onConfirm: async () => {
        try {
          await axios.patch(`${API_BASE_URL}/orders/${orderId}/status`, { status: newStatus });
          setOrders(orders.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o)));
          setEditingStatus((prev) => { const newEdit = { ...prev }; delete newEdit[orderId]; return newEdit; });
          setAlert(null);
          toast.success(`Order status updated to ${newStatus}`);
        } catch (err) {
          const errorMessage = (err as AxiosError<ErrorResponse>).response?.data?.error?.error || "Failed to update status";
          toast.error(errorMessage);
        //   setError(errorMessage);
          setAlert(null);
        }
      },
    });
  };

  const handlePageChange = (page: number) => page >= 1 && page <= totalPages && setCurrentPage(page);

  const handleSort = (key: SortKey) => setSortConfig((prev) => ({ key, order: prev.key === key && prev.order === "asc" ? "desc" : "asc" }));

  const exportData = (format: "csv" | "pdf") => {
    const data = filteredOrders.map((o) => ({
      orderId: o.orderId,
      customerId: o.customerId,
      total: `$${o.total.toFixed(2)}`,
      status: o.status,
      createdAt: new Date(o.createdAt).toLocaleDateString(),
    }));
    if (format === "csv") {
      const headers = ["Order ID,Customer ID,Total,Status,Created At"];
      const rows = data.map((o) => `${o.orderId},${o.customerId},${o.total},${o.status},${o.createdAt}`);
      const blob = new Blob([[...headers, ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "orders.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const doc = new jsPDF();
      doc.text("Orders List", 14, 20);
      autoTable(doc, {
        startY: 30,
        head: [["Order ID", "Customer ID", "Total", "Status", "Created At"]],
        body: data.map((o) => [o.orderId, o.customerId, o.total, o.status, o.createdAt]),
      });
      doc.save("orders.pdf");
    }
  };

  const columns: { key: SortKey; label: string }[] = [
    { key: "orderId", label: "Order ID" },
    { key: "customerId", label: "Customer ID" },
    { key: "total", label: "Total" },
    { key: "status", label: "Status" },
    { key: "createdAt", label: "Created At" },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-full mx-auto">
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} closeOnClick draggable pauseOnHover />

      <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Orders</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          {[
            { onClick: () => setIsModalOpen(true), icon: Plus, label: "Add Order", color: "blue" },
            { onClick: () => exportData("csv"), icon: Download, label: "Export CSV", color: "green" },
            { onClick: () => exportData("pdf"), icon: Download, label: "Export PDF", color: "purple" },
          ].map(({ onClick, icon: Icon, label, color }) => (
            <motion.button
              key={label}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClick}
              className={`bg-${color}-600 text-white px-4 py-2 rounded-lg hover:bg-${color}-700 flex items-center gap-2 w-full sm:w-auto`}
            >
              <Icon size={20} /> {label}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Search by Order ID or Customer ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | IOrder["status"])}
          className="border rounded-lg px-4 py-2 w-full sm:w-40 focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 mb-4">{error}</motion.p>}
      {loading && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-gray-600">Loading...</motion.p>}

      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 overflow-x-auto">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Order List</h3>
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              {columns.map(({ key, label }) => (
                <th key={key} className="px-3 sm:px-6 py-3 cursor-pointer" onClick={() => handleSort(key)}>
                  {label} {sortConfig.key === key && (sortConfig.order === "asc" ? "↑" : "↓")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filteredOrders.map((order) => (
                <motion.tr
                  key={order._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white border-b hover:bg-gray-50"
                >
                  <td className="px-3 sm:px-6 py-4">{order.orderId}</td>
                  <td className="px-3 sm:px-6 py-4">{order.customerId}</td>
                  <td className="px-3 sm:px-6 py-4">${order.total.toFixed(2)}</td>
                  <td className="px-3 sm:px-6 py-4">
                    {editingStatus[order._id] !== undefined ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={editingStatus[order._id]}
                          onChange={(e) => handleStatusEdit(order._id, e.target.value as IOrder["status"])}
                          className="border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                        >
                          {["pending", "shipped", "delivered", "cancelled"].map((status) => (
                            <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                          ))}
                        </select>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleStatusSave(order._id)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Save size={18} />
                        </motion.button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>{order.status}</span>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleStatusEdit(order._id, order.status)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </motion.button>
                      </div>
                    )}
                  </td>
                  <td className="px-3 sm:px-6 py-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="px-3 sm:px-6 py-4"></td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>

        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
          >
            <ChevronLeft size={18} /> Previous
          </motion.button>
          <div className="flex gap-2 flex-wrap justify-center">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <motion.button
                key={page}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 rounded-md ${currentPage === page ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
              >
                {page}
              </motion.button>
            ))}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
          >
            Next <ChevronRight size={18} />
          </motion.button>
        </div>
      </div>

      <AddOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        newOrder={newOrder}
        setNewOrder={setNewOrder}
        onSubmit={handleAddOrder}
      />
      <AnimatePresence>{alert && <Alert message={alert.message} onConfirm={alert.onConfirm} onCancel={() => setAlert(null)} />}</AnimatePresence>
    </div>
  );
}