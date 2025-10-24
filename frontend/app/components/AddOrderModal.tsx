import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import axios from "axios";
import type { IOrder, IOrderItem } from "~/routes/_dashboard.orders";

interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
}

interface AddOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  newOrder: { orderId: string; customerId: string; total: number; items: IOrderItem[]; status: IOrder["status"] };
  setNewOrder: React.Dispatch<React.SetStateAction<{ orderId: string; customerId: string; total: number; items: IOrderItem[]; status: IOrder["status"] }>>;
  onSubmit: (e: React.FormEvent) => void;
}

export default function AddOrderModal({ isOpen, onClose, newOrder, setNewOrder, onSubmit }: AddOrderModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState<string[]>(newOrder.items.map(() => ""));
  const [error, setError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ message: string; onConfirm?: () => void } | null>(null);
  const [isCustomerValid, setIsCustomerValid] = useState<boolean | null>(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/products`);
        setProducts(data);
      } catch {
        setError("Failed to fetch products");
      }
    };
    fetchProducts();
  }, []);

  const validateCustomerId = (customerId: string) => {
    const isValid = customerId.length >= 3;
    setIsCustomerValid(isValid);
    if (!isValid) {
      setAlert({ message: "Customer ID must be at least 3 characters long." });
    }
    return isValid;
  };

  const calculateTotal = (items: IOrderItem[]) => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleItemChange = (index: number, field: keyof IOrderItem, value: string | number) => {
    const updatedItems = [...newOrder.items];
    if (field === "productId") {
      const selectedProduct = products.find((p) => p._id === value);
      updatedItems[index] = {
        ...updatedItems[index],
        productId: value as string,
        price: selectedProduct ? selectedProduct.price : 0,
        quantity: selectedProduct && updatedItems[index].quantity > selectedProduct.stock ? 0 : updatedItems[index].quantity,
      };
      if (selectedProduct && updatedItems[index].quantity > selectedProduct.stock) {
        setAlert({ message: `Quantity exceeds available stock (${selectedProduct.stock}) for ${selectedProduct.name}.` });
      }
    } else if (field === "quantity") {
      const selectedProduct = products.find((p) => p._id === updatedItems[index].productId);
      const quantity = parseInt(value as string) || 0;
      if (selectedProduct && quantity > selectedProduct.stock) {
        setAlert({ message: `Quantity exceeds available stock (${selectedProduct.stock}) for ${selectedProduct.name}.` });
        return;
      }
      updatedItems[index] = { ...updatedItems[index], quantity };
    }
    setNewOrder({ ...newOrder, items: updatedItems, total: calculateTotal(updatedItems) });
  };

  const handleProductSearch = (index: number, value: string) => {
    const updatedSearch = [...productSearch];
    updatedSearch[index] = value;
    setProductSearch(updatedSearch);
  };

  const addItem = () => {
    const updatedItems = [...newOrder.items, { productId: "", quantity: 0, price: 0 }];
    setNewOrder({ ...newOrder, items: updatedItems, total: calculateTotal(updatedItems) });
    setProductSearch([...productSearch, ""]);
  };

  const removeItem = (index: number) => {
    const updatedItems = newOrder.items.filter((_, i) => i !== index);
    setNewOrder({ ...newOrder, items: updatedItems, total: calculateTotal(updatedItems) });
    setProductSearch(productSearch.filter((_, i) => i !== index));
  };

  const filteredProducts = (index: number) =>
    productSearch[index]
      ? products.filter((p) =>
          p.name.toLowerCase().includes(productSearch[index].toLowerCase()) ||
          p._id.toLowerCase().includes(productSearch[index].toLowerCase())
        )
      : products;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCustomerId(newOrder.customerId)) {
      setAlert({ message: "Customer ID must be at least 3 characters long." });
      return;
    }
    if (newOrder.items.some((item) => !item.productId)) {
      setAlert({ message: "All items must have a selected product." });
      return;
    }
    onSubmit(e);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.8 }}
        className="bg-white rounded-lg p-6 w-full max-w-md"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Add New Order</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
            <X size={24} />
          </button>
        </div>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <AnimatePresence>
          {alert && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg"
            >
              <p>{alert.message}</p>
              <button
                onClick={() => setAlert(null)}
                className="bg-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400 mt-2"
              >
                OK
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Customer ID</label>
            <input
              type="text"
              value={newOrder.customerId}
              onChange={(e) => setNewOrder({ ...newOrder, customerId: e.target.value })}
              onBlur={() => validateCustomerId(newOrder.customerId)}
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${isCustomerValid === false ? "border-red-500" : ""}`}
              required
            />
            {isCustomerValid === false && (
              <p className="text-red-500 text-sm mt-1">Customer ID must be at least 3 characters</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Total</label>
            <p className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-700">
              ${newOrder.total.toFixed(2)}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={newOrder.status}
              onChange={(e) => setNewOrder({ ...newOrder, status: e.target.value as IOrder["status"] })}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              {["pending", "shipped", "delivered", "cancelled"].map((status) => (
                <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Items</label>
            {newOrder.items.map((item, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-2 mb-2">
                <div className="w-full">
                  <input
                    type="text"
                    placeholder="Search product by name..."
                    value={productSearch[index] || ""}
                    onChange={(e) => handleProductSearch(index, e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 mb-1"
                  />
                  <select
                    value={item.productId}
                    onChange={(e) => handleItemChange(index, "productId", e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a product</option>
                    {filteredProducts(index).map((product) => (
                      <option key={product._id} value={product._id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="number"
                  placeholder="Quantity"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value) || 0)}
                  className="w-full sm:w-24 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  min="0"
                  required
                />
                {newOrder.items.length > 1 && (
                  <button type="button" onClick={() => removeItem(index)} className="text-red-600 hover:text-red-800">
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addItem}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              + Add Item
            </button>
          </div>
          <div className="flex gap-4">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 w-full">
              Add Order
            </button>
            <button type="button" onClick={onClose} className="bg-gray-300 px-4 py-2 rounded-lg w-full">
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}