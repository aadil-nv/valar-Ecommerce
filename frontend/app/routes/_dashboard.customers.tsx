import { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";
import { Plus, Save, ChevronLeft, ChevronRight, Download, ToggleLeft, ToggleRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Alert from "../components/Alert";
import AddCustomerModal from "../components/AddCustomerModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface ICustomer {
  _id: string;
  customerName: string;
  email: string;
  phone: string;
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type SortKey = "customerName" | "email" | "phone" | "isBlocked" | "createdAt";
type SortOrder = "asc" | "desc";

interface ErrorResponse {
  errors?: string[];
  message?: string;
}

export default function Customers() {
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<ICustomer[]>([]);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    customerName: "",
    email: "",
    phone: "",
    isBlocked: false,
  });
  const [editingName, setEditingName] = useState<{ [key: string]: string | undefined }>({});
  const [editingEmail, setEditingEmail] = useState<{ [key: string]: string | undefined }>({});
  const [editingPhone, setEditingPhone] = useState<{ [key: string]: string | undefined }>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [alert, setAlert] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "blocked" | "active">("all");
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: SortOrder }>({
    key: "createdAt",
    order: "desc",
  });
  const itemsPerPage = 5;

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/customer/query?page=${currentPage}&limit=${itemsPerPage}&search=${searchTerm}&sortBy=${sortConfig.key}&sortOrder=${sortConfig.order}`
        );
        setCustomers(response.data.customers);
        setTotalPages(response.data.totalPages);
        setFilteredCustomers(response.data.customers);
      } catch (err) {
        const errorMessage =
          (err as AxiosError<ErrorResponse>).response?.data?.errors?.join(", ") ||
          (err as AxiosError<ErrorResponse>).response?.data?.message ||
          "Failed to fetch customers";
        toast.error(errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, [currentPage, searchTerm, sortConfig, API_BASE_URL]);

  // Handle client-side filtering for status
  useEffect(() => {
    let result = [...customers];
    if (statusFilter !== "all") {
      result = result.filter((customer) =>
        statusFilter === "blocked" ? customer.isBlocked : !customer.isBlocked
      );
    }
    setFilteredCustomers(result);
  }, [customers, statusFilter]);

  // Handle adding new customer
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.customerName.trim() || newCustomer.customerName.length < 2) {
      toast.error("Customer name must be at least 2 characters");
      return;
    }
    if (!newCustomer.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCustomer.email)) {
      toast.error("Invalid email format");
      return;
    }
    if (newCustomer.phone && !/^\+?[1-9]\d{9,14}$/.test(newCustomer.phone)) {
      toast.error("Phone number must be at least 10 digits");
      return;
    }
    setAlert({
      message: "Are you sure you want to add this customer?",
      onConfirm: async () => {
        try {
          const response = await axios.post(`${API_BASE_URL}/customer`, newCustomer);
          setCustomers([...customers, response.data]);
          setFilteredCustomers([...filteredCustomers, response.data]);
          setIsCustomerModalOpen(false);
          setNewCustomer({ customerName: "", email: "", phone: "", isBlocked: false });
          setAlert(null);
          toast.success("Customer added successfully");
        } catch (err) {
          const errorMessage =
            (err as AxiosError<ErrorResponse>).response?.data?.errors?.join(", ") ||
            (err as AxiosError<ErrorResponse>).response?.data?.message ||
            "Failed to add customer";
          toast.error(errorMessage);
          setError(errorMessage);
          setAlert(null);
        }
      },
    });
  };

  // Handle toggle block status
  const handleToggleBlock = (customerId: string, currentStatus: boolean) => {
    const action = currentStatus ? "unblock" : "block";
    setAlert({
      message: `Are you sure you want to ${action} this customer?`,
      onConfirm: async () => {
        try {
          await axios.patch(`${API_BASE_URL}/customer/${customerId}/block`, {
            isBlocked: !currentStatus,
          });
          setCustomers(
            customers.map((customer) =>
              customer._id === customerId ? { ...customer, isBlocked: !currentStatus } : customer
            )
          );
          setFilteredCustomers(
            filteredCustomers.map((customer) =>
              customer._id === customerId ? { ...customer, isBlocked: !currentStatus } : customer
            )
          );
          setAlert(null);
          toast.success(`Customer ${action}ed successfully`);
        } catch (err) {
          const errorMessage =
            (err as AxiosError<ErrorResponse>).response?.data?.errors?.join(", ") ||
            (err as AxiosError<ErrorResponse>).response?.data?.message ||
            `Failed to ${action} customer`;
          toast.error(errorMessage);
          setError(errorMessage);
          setAlert(null);
        }
      },
    });
  };

  // Handle name edit
  const handleNameEdit = (customerId: string, name: string) => {
    setEditingName({ ...editingName, [customerId]: name });
  };

  // Handle email edit
  const handleEmailEdit = (customerId: string, email: string) => {
    setEditingEmail({ ...editingEmail, [customerId]: email });
  };

  // Handle phone edit
  const handlePhoneEdit = (customerId: string, phone: string) => {
    setEditingPhone({ ...editingPhone, [customerId]: phone });
  };

  // Save edited customer
  const handleCustomerSave = async (customerId: string) => {
    const newName = editingName[customerId];
    const newEmail = editingEmail[customerId];
    const newPhone = editingPhone[customerId];

    // Validate inputs
    if (newName !== undefined && (!newName.trim() || newName.length < 2)) {
      toast.error("Customer name must be at least 2 characters");
      return;
    }
    if (newEmail !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      toast.error("Invalid email format");
      return;
    }
    if (newPhone !== undefined && newPhone && !/^\+?[1-9]\d{9,14}$/.test(newPhone)) {
      toast.error("Phone number must be at least 10 digits");
      return;
    }

    // Only proceed if at least one field is being edited
    if (newName === undefined && newEmail === undefined && newPhone === undefined) return;

    setAlert({
      message: "Are you sure you want to update this customer?",
      onConfirm: async () => {
        try {
          const payload: { customerName?: string; email?: string; phone?: string } = {};
          if (newName !== undefined) payload.customerName = newName;
          if (newEmail !== undefined) payload.email = newEmail;
          if (newPhone !== undefined) payload.phone = newPhone;

          await axios.patch(`${API_BASE_URL}/customer/${customerId}`, payload);
          setCustomers(
            customers.map((customer) =>
              customer._id === customerId
                ? {
                    ...customer,
                    customerName: newName ?? customer.customerName,
                    email: newEmail ?? customer.email,
                    phone: newPhone ?? customer.phone,
                  }
                : customer
            )
          );
          setFilteredCustomers(
            filteredCustomers.map((customer) =>
              customer._id === customerId
                ? {
                    ...customer,
                    customerName: newName ?? customer.customerName,
                    email: newEmail ?? customer.email,
                    phone: newPhone ?? customer.phone,
                  }
                : customer
            )
          );

          const newEditingName = { ...editingName };
          const newEditingEmail = { ...editingEmail };
          const newEditingPhone = { ...editingPhone };
          delete newEditingName[customerId];
          delete newEditingEmail[customerId];
          delete newEditingPhone[customerId];
          setEditingName(newEditingName);
          setEditingEmail(newEditingEmail);
          setEditingPhone(newEditingPhone);
          setAlert(null);
          toast.success("Customer updated successfully");
        } catch (err) {
          const errorMessage =
            (err as AxiosError<ErrorResponse>).response?.data?.errors?.join(", ") ||
            (err as AxiosError<ErrorResponse>).response?.data?.message ||
            "Failed to update customer";
          toast.error(errorMessage);
          setError(errorMessage);
          setAlert(null);
        }
      },
    });
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Sorting handler
  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => ({
      key,
      order: prev.key === key && prev.order === "asc" ? "desc" : "asc",
    }));
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["Name,Email,Phone,Status,Created At"];
    const rows = filteredCustomers.map((customer) => {
      const status = customer.isBlocked ? "Blocked" : "Active";
      const createdAt = new Date(customer.createdAt).toLocaleDateString();
      return `${customer.customerName},${customer.email},${customer.phone || "-"},${status},${createdAt}`;
    });
    const csvContent = [...headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "customers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredCustomers.map((customer) => ({
        Name: customer.customerName,
        Email: customer.email,
        Phone: customer.phone || "-",
        Status: customer.isBlocked ? "Blocked" : "Active",
        "Created At": new Date(customer.createdAt).toLocaleDateString(),
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
    XLSX.writeFile(workbook, "customers.xlsx");
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Customers List", 14, 20);
    autoTable(doc, {
      startY: 30,
      head: [["Name", "Email", "Phone", "Status", "Created At"]],
      body: filteredCustomers.map((customer) => {
        const status = customer.isBlocked ? "Blocked" : "Active";
        const createdAt = new Date(customer.createdAt).toLocaleDateString();
        return [customer.customerName, customer.email, customer.phone || "-", status, createdAt];
      }),
    });
    doc.save("customers.pdf");
  };

  return (
    <div className="relative p-4">
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} closeOnClick draggable pauseOnHover />

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Customers</h2>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCustomerModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors duration-200"
          >
            <Plus size={20} /> Add Customer
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={exportToCSV}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors duration-200"
          >
            <Download size={20} /> Export CSV
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={exportToExcel}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors duration-200"
          >
            <Download size={20} /> Export Excel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={exportToPDF}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2 transition-colors duration-200"
          >
            <Download size={20} /> Export PDF
          </motion.button>
        </div>
      </div>

      <div className="mb-4 flex gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border rounded-lg px-4 py-2 w-full sm:w-64 focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | "blocked" | "active")}
          className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-red-500 mb-4"
        >
          {error}
        </motion.p>
      )}
      {loading && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-gray-600"
        >
          Loading...
        </motion.p>
      )}

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 overflow-x-auto">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer List</h3>
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-3 cursor-pointer" onClick={() => handleSort("customerName")}>
                Name {sortConfig.key === "customerName" && (sortConfig.order === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-6 py-3 cursor-pointer" onClick={() => handleSort("email")}>
                Email {sortConfig.key === "email" && (sortConfig.order === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-6 py-3 cursor-pointer" onClick={() => handleSort("phone")}>
                Phone {sortConfig.key === "phone" && (sortConfig.order === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-6 py-3 cursor-pointer" onClick={() => handleSort("isBlocked")}>
                Status {sortConfig.key === "isBlocked" && (sortConfig.order === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-6 py-3 cursor-pointer" onClick={() => handleSort("createdAt")}>
                Created At {sortConfig.key === "createdAt" && (sortConfig.order === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filteredCustomers.map((customer) => (
                <motion.tr
                  key={customer._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white border-b hover:bg-gray-50 transition-colors duration-200"
                >
                  <td className="px-6 py-4">
                    {editingName[customer._id] !== undefined ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingName[customer._id]}
                          onChange={(e) => handleNameEdit(customer._id, e.target.value)}
                          className="w-40 border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                          placeholder="Enter customer name"
                        />
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleCustomerSave(customer._id)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Save size={18} />
                        </motion.button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>{customer.customerName}</span>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleNameEdit(customer._id, customer.customerName)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </motion.button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingEmail[customer._id] !== undefined ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="email"
                          value={editingEmail[customer._id]}
                          onChange={(e) => handleEmailEdit(customer._id, e.target.value)}
                          className="w-40 border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                          placeholder="Enter email"
                        />
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleCustomerSave(customer._id)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Save size={18} />
                        </motion.button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>{customer.email}</span>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEmailEdit(customer._id, customer.email)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </motion.button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingPhone[customer._id] !== undefined ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingPhone[customer._id]}
                          onChange={(e) => handlePhoneEdit(customer._id, e.target.value)}
                          className="w-40 border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                          placeholder="Enter phone number"
                        />
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleCustomerSave(customer._id)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Save size={18} />
                        </motion.button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>{customer.phone || "-"}</span>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handlePhoneEdit(customer._id, customer.phone || "")}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </motion.button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">{customer.isBlocked ? "Blocked" : "Active"}</td>
                  <td className="px-6 py-4">{new Date(customer.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleToggleBlock(customer._id, customer.isBlocked)}
                      className={customer.isBlocked ? "text-green-600 hover:text-green-800" : "text-red-600 hover:text-red-800"}
                    >
                      {customer.isBlocked ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    </motion.button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>

        <div className="flex justify-between items-center mt-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <ChevronLeft size={18} /> Previous
          </motion.button>
          <div className="flex gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <motion.button
                key={page}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 rounded-md ${
                  currentPage === page
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                } transition-colors duration-200`}
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
            className="flex items-center gap-2 px-4 py-2 text-gray-600 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Next <ChevronRight size={18} />
          </motion.button>
        </div>
      </div>

      <AddCustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        newCustomer={newCustomer}
        setNewCustomer={setNewCustomer}
        onSubmit={handleAddCustomer}
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