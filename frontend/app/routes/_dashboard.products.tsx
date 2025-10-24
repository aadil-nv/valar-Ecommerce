import { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Trash2, Save, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Alert from "../components/Alert";
import AddProductModal from "../components/AddProductModal";

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

export default function Products() {
  const [products, setProducts] = useState<IProduct[]>([]);
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
  const itemsPerPage = 5;

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

  // Fetch products and categories
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/products/paginated?page=${currentPage}&limit=${itemsPerPage}`),
          axios.get(`${API_BASE_URL}/categories`),
        ]);
        setProducts(productsResponse.data.products.filter((p: IProduct) => !p.isDeleted));
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

  // Handle soft delete
  const handleSoftDelete = (productId: string) => {
    setAlert({
      message: "Are you sure you want to delete this product?",
      onConfirm: async () => {
        try {
          await axios.delete(`${API_BASE_URL}/products/${productId}`);
          setProducts(products.filter((product) => product._id !== productId));
          setAlert(null);
        } catch (err) {
          setError("Failed to delete product");
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

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Products</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors duration-200"
        >
          <Plus size={20} /> Add Product
        </motion.button>
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
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Category</th>
              <th className="px-6 py-3">Price</th>
              <th className="px-6 py-3">Stock</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {products.map((product) => (
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
                  <td className="px-6 py-4">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleSoftDelete(product._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={18} />
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