import { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Save, ChevronLeft, ChevronRight, Download, ToggleLeft, ToggleRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Alert from "../components/Alert";
import AddProductModal from "../components/AddProductModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ICategory {
  _id: string;
  name: string;
}

interface IProduct {
  _id: string;
  name: string;
  category: ICategory | string;
  price: number;
  inventoryCount: number;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

type SortKey = "name" | "category" | "price" | "inventoryCount" | "isDeleted" | "createdAt";
type SortOrder = "asc" | "desc";

export default function Products() {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    price: 0,
    inventoryCount: 0,
  });
  const [editingPrice, setEditingPrice] = useState<{ [key: string]: number | undefined }>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [alert, setAlert] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "listed" | "unlisted">("all");
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: SortOrder }>({
    key: "createdAt",
    order: "desc",
  });
  const itemsPerPage = 5;

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

  // Fetch products and categories
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/products/paginated?page=${currentPage}&limit=${itemsPerPage}`),
          axios.get(`${API_BASE_URL}/categories`),
        ]);
        setProducts(productsResponse.data.products);
        setTotalPages(Math.ceil(productsResponse.data.total / itemsPerPage));
        setCategories(categoriesResponse.data);
      } catch (err) {
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentPage, API_BASE_URL]);

  // Handle client-side filtering and sorting
  useEffect(() => {
    let result = [...products];

    // Search by name
    if (searchTerm) {
      result = result.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (categoryFilter) {
      result = result.filter((product) =>
        typeof product.category === "string"
          ? product.category === categoryFilter
          : product.category._id === categoryFilter
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      result = result.filter((product) =>
        statusFilter === "listed" ? !product.isDeleted : product.isDeleted
      );
    }

    // Sort
    result.sort((a, b) => {
      const key = sortConfig.key;
      const order = sortConfig.order === "asc" ? 1 : -1;

      if (key === "category") {
        const aValue = typeof a.category === "string" ? a.category : a.category.name;
        const bValue = typeof b.category === "string" ? b.category : b.category.name;
        return aValue.localeCompare(bValue) * order;
      }
      if (key === "isDeleted") {
        return (a.isDeleted === b.isDeleted ? 0 : a.isDeleted ? 1 : -1) * order;
      }
      if (key === "createdAt") {
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * order;
      }
      return ((a[key] as number) - (b[key] as number)) * order;
    });

    setFilteredProducts(result);
  }, [products, searchTerm, categoryFilter, statusFilter, sortConfig]);

  // Handle adding new product
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert({
      message: "Are you sure you want to add this product?",
      onConfirm: async () => {
        try {
          const response = await axios.post(`${API_BASE_URL}/products`, newProduct);
          setProducts([...products, response.data]);
          setIsModalOpen(false);
          setNewProduct({ name: "", category: "", price: 0, inventoryCount: 0 });
          setAlert(null);
        } catch (err) {
          setError("Failed to add product");
          setAlert(null);
        }
      },
    });
  };

  // Handle toggle product status (list/unlist)
  const handleToggleStatus = (productId: string, currentStatus: boolean) => {
    const action = currentStatus ? "relist" : "unlist";
    setAlert({
      message: `Are you sure you want to ${action} this product?`,
      onConfirm: async () => {
        try {
          await axios.patch(`${API_BASE_URL}/products/${productId}`, { isDeleted: !currentStatus });
          setProducts(products.map((product) =>
            product._id === productId ? { ...product, isDeleted: !currentStatus } : product
          ));
          setAlert(null);
        } catch (err) {
          setError(`Failed to ${action} product`);
          setAlert(null);
        }
      },
    });
  };

  // Handle price edit
  const handlePriceEdit = (productId: string, price: number) => {
    setEditingPrice({ ...editingPrice, [productId]: price });
  };

  // Save edited price
  const handlePriceSave = async (productId: string) => {
    const newPrice = editingPrice[productId];
    if (newPrice === undefined) return;

    setAlert({
      message: "Are you sure you want to update this product's price?",
      onConfirm: async () => {
        try {
          await axios.patch(`${API_BASE_URL}/products/${productId}`, { price: newPrice });
          setProducts(
            products.map((product) =>
              product._id === productId ? { ...product, price: newPrice } : product
            )
          );
          const newEditingPrice = { ...editingPrice };
          delete newEditingPrice[productId];
          setEditingPrice(newEditingPrice);
          setAlert(null);
        } catch (err) {
          setError("Failed to update price");
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
    const headers = ["Name,Category,Price,Stock,Status,Created At"];
    const rows = filteredProducts.map((product) => {
      const category = typeof product.category === "string" ? product.category : product.category.name;
      const status = product.isDeleted ? "Unlisted" : "Listed";
      const createdAt = new Date(product.createdAt).toLocaleDateString();
      return `${product.name},${category},${product.price.toFixed(2)},${product.inventoryCount},${status},${createdAt}`;
    });
    const csvContent = [...headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "products.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Products List", 14, 20);
    autoTable(doc, {
      startY: 30,
      head: [["Name", "Category", "Price", "Stock", "Status", "Created At"]],
      body: filteredProducts.map((product) => {
        const category = typeof product.category === "string" ? product.category : product.category.name;
        const status = product.isDeleted ? "Unlisted" : "Listed";
        const createdAt = new Date(product.createdAt).toLocaleDateString();
        return [product.name, category, `$${product.price.toFixed(2)}`, product.inventoryCount, status, createdAt];
      }),
    });
    doc.save("products.pdf");
  };

  return (
    <div className="relative p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Products</h2>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors duration-200"
          >
            <Plus size={20} /> Add Product
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
            onClick={exportToPDF}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2 transition-colors duration-200"
          >
            <Download size={20} /> Export PDF
          </motion.button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-4 flex gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border rounded-lg px-4 py-2 w-full sm:w-64 focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | "listed" | "unlisted")}
          className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Statuses</option>
          <option value="listed">Listed</option>
          <option value="unlisted">Unlisted</option>
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
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Product List</h3>
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-3 cursor-pointer" onClick={() => handleSort("name")}>
                Name {sortConfig.key === "name" && (sortConfig.order === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-6 py-3 cursor-pointer" onClick={() => handleSort("category")}>
                Category {sortConfig.key === "category" && (sortConfig.order === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-6 py-3 cursor-pointer" onClick={() => handleSort("price")}>
                Price {sortConfig.key === "price" && (sortConfig.order === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-6 py-3 cursor-pointer" onClick={() => handleSort("inventoryCount")}>
                Stock {sortConfig.key === "inventoryCount" && (sortConfig.order === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-6 py-3 cursor-pointer" onClick={() => handleSort("isDeleted")}>
                Status {sortConfig.key === "isDeleted" && (sortConfig.order === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-6 py-3 cursor-pointer" onClick={() => handleSort("createdAt")}>
                Created At {sortConfig.key === "createdAt" && (sortConfig.order === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filteredProducts.map((product) => (
                <motion.tr
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white border-b hover:bg-gray-50 transition-colors duration-200"
                >
                  <td className="px-6 py-4">{product.name}</td>
                  <td className="px-6 py-4">
                    {typeof product.category === "string"
                      ? product.category
                      : product.category.name}
                  </td>
                  <td className="px-6 py-4">
                    {editingPrice[product._id] !== undefined ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editingPrice[product._id]}
                          onChange={(e) =>
                            handlePriceEdit(product._id, parseFloat(e.target.value) || 0)
                          }
                          className="w-24 border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                          min="0"
                          step="0.01"
                        />
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handlePriceSave(product._id)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Save size={18} />
                        </motion.button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>${product.price.toFixed(2)}</span>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handlePriceEdit(product._id, product.price)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </motion.button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">{product.inventoryCount}</td>
                  <td className="px-6 py-4">{product.isDeleted ? "Unlisted" : "Listed"}</td>
                  <td className="px-6 py-4">{new Date(product.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleToggleStatus(product._id, product.isDeleted)}
                      className={product.isDeleted ? "text-green-600 hover:text-green-800" : "text-red-600 hover:text-red-800"}
                    >
                      {product.isDeleted ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    </motion.button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>

        {/* Pagination */}
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

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categories={categories}
        newProduct={newProduct}
        setNewProduct={setNewProduct}
        onSubmit={handleAddProduct}
      />

      {/* Alert Confirmation */}
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