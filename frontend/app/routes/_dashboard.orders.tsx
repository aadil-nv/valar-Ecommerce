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
  customerName?: string;
  total: number;
  items: IOrderItem[];
  status: "pending" | "shipped" | "delivered" | "cancelled";
  createdAt: Date;
}

type SortKey = "orderId" | "customerName" | "total" | "status" | "createdAt";
type SortOrder = "asc" | "desc";

interface ErrorResponse {
  error?: { error: string };
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
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [alert, setAlert] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | IOrder["status"]>("all");
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: SortOrder }>({
    key: "createdAt",
    order: "desc",
  });
  const itemsPerPage = 5;
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

  /* --------------------------------------------------------------
     FETCH ORDERS – runs when page / filters / sort change
  -------------------------------------------------------------- */
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
      const { data } = await axios.get(`${API_BASE_URL}/orders/query?${params}`);
      setOrders(data.data);
      setFilteredOrders(data.data);
      setTotalPages(Math.ceil(data.total / itemsPerPage));
    } catch (err) {
      const msg =
        (err as AxiosError<ErrorResponse>).response?.data?.error?.error ||
        "Failed to fetch orders";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentPage, searchTerm, statusFilter, sortConfig]);

  /* --------------------------------------------------------------
     ADD ORDER – after POST we re-fetch the current page
  -------------------------------------------------------------- */
  const handleAddOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert({
      message: "Are you sure you want to add this order?",
      onConfirm: async () => {
        try {
          await axios.post(`${API_BASE_URL}/orders`, newOrder);
          setIsModalOpen(false);
          setNewOrder({
            orderId: "",
            customerId: "",
            total: 0,
            items: [{ productId: "", quantity: 0, price: 0 }],
            status: "pending",
          });
          toast.success("Order added successfully");
          // RE-FETCH CURRENT PAGE
          fetchOrders();
        } catch (err) {
          const msg =
            (err as AxiosError<ErrorResponse>).response?.data?.error?.error ||
            "Failed to add order";
          toast.error(msg);
        } finally {
          setAlert(null);
        }
      },
    });
  };

  /* --------------------------------------------------------------
     STATUS EDIT / SAVE
  -------------------------------------------------------------- */
  const handleStatusEdit = (orderId: string, status: IOrder["status"]) => {
    setEditingStatus({ ...editingStatus, [orderId]: status });
  };

  const handleStatusSave = async (orderId: string) => {
    const newStatus = editingStatus[orderId];
    if (!newStatus) return;
    setAlert({
      message: `Change status to ${newStatus}?`,
      onConfirm: async () => {
        try {
          await axios.patch(`${API_BASE_URL}/orders/${orderId}/status`, { status: newStatus });
          setOrders((prev) =>
            prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
          );
          setEditingStatus((prev) => {
            const copy = { ...prev };
            delete copy[orderId];
            return copy;
          });
          toast.success(`Status → ${newStatus}`);
        } catch (err) {
          toast.error(
            (err as AxiosError<ErrorResponse>).response?.data?.error?.error ||
              "Failed to update status"
          );
        } finally {
          setAlert(null);
        }
      },
    });
  };

  /* --------------------------------------------------------------
     PAGINATION / SORT
  -------------------------------------------------------------- */
  const handlePageChange = (page: number) => page >= 1 && page <= totalPages && setCurrentPage(page);
  const handleSort = (key: SortKey) =>
    setSortConfig((prev) => ({
      key,
      order: prev.key === key && prev.order === "asc" ? "desc" : "asc",
    }));

  /* --------------------------------------------------------------
     EXPORT CSV / PDF
  -------------------------------------------------------------- */
  const exportData = (format: "csv" | "pdf") => {
    const rows = filteredOrders.map((o) => ({
      orderId: o.orderId,
      customerName: o.customerName || "Unknown Customer",
      total: `$${o.total.toFixed(2)}`,
      status: o.status,
      createdAt: new Date(o.createdAt).toLocaleDateString(),
    }));

    if (format === "csv") {
      const csv = [
        "Order ID,Customer Name,Total,Status,Created At",
        ...rows.map((r) => `${r.orderId},${r.customerName},${r.total},${r.status},${r.createdAt}`),
      ].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "orders.csv";
      a.click();
    } else {
      const doc = new jsPDF();
      doc.text("Orders List", 14, 20);
      autoTable(doc, {
        startY: 30,
        head: [["Order ID", "Customer Name", "Total", "Status", "Created At"]],
        body: rows.map((r) => [r.orderId, r.customerName, r.total, r.status, r.createdAt]),
      });
      doc.save("orders.pdf");
    }
  };

  const columns: { key: SortKey; label: string }[] = [
    { key: "orderId", label: "Order ID" },
    { key: "customerName", label: "Customer Name" },
    { key: "total", label: "Total" },
    { key: "status", label: "Status" },
    { key: "createdAt", label: "Created At" },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-full mx-auto">
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} closeOnClick draggable pauseOnHover />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Orders</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 w-full sm:w-auto"
          >
            <Plus size={20} /> Add Order
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => exportData("csv")}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 w-full sm:w-auto"
          >
            <Download size={20} /> Export CSV
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => exportData("pdf")}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2 w-full sm:w-auto"
          >
            <Download size={20} /> Export PDF
          </motion.button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col sm:flex-row gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Search by Order ID or Customer Name..."
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

      {/* Loading / Error */}
      {loading && <p className="text-gray-600">Loading...</p>}

      {/* Table */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 overflow-x-auto">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Order List</h3>
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              {columns.map(({ key, label }) => (
                <th
                  key={key}
                  className="px-3 sm:px-6 py-3 cursor-pointer"
                  onClick={() => handleSort(key)}
                >
                  {label}{" "}
                  {sortConfig.key === key && (sortConfig.order === "asc" ? "↑" : "↓")}
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
                  className="bg-white border-b hover:bg-gray-50"
                >
                  <td className="px-3 sm:px-6 py-4">{order.orderId}</td>
                  <td className="px-3 sm:px-6 py-4">
                    {order.customerName || "Unknown Customer"}
                  </td>
                  <td className="px-3 sm:px-6 py-4">${order.total.toFixed(2)}</td>
                  <td className="px-3 sm:px-6 py-4">
                    {editingStatus[order._id] !== undefined ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={editingStatus[order._id]}
                          onChange={(e) =>
                            handleStatusEdit(order._id, e.target.value as IOrder["status"])
                          }
                          className="border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                        >
                          {["pending", "shipped", "delivered", "cancelled"].map((s) => (
                            <option key={s} value={s}>
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </option>
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
                  <td className="px-3 sm:px-6 py-4">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>

        {/* Pagination */}
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
                className={`px-3 py-1 rounded-md ${
                  currentPage === page ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
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

      {/* Modals */}
      <AddOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        newOrder={newOrder}
        setNewOrder={setNewOrder}
        onSubmit={handleAddOrder}
      />
      <AnimatePresence>
        {alert && (
          <Alert
            message={alert.message}
            onConfirm={alert.onConfirm}
            onCancel={() => setAlert(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}