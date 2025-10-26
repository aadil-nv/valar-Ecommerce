import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import axios, { AxiosError } from "axios";
import type { IOrder, IOrderItem } from "~/routes/_dashboard.orders";

interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
}

interface Customer {
  _id: string;
  customerName: string;
}

interface AddOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  newOrder: {
    orderId: string;
    customerId: string;
    total: number;
    items: IOrderItem[];
    status: IOrder["status"];
  };
  setNewOrder: React.Dispatch<
    React.SetStateAction<{
      orderId: string;
      customerId: string;
      total: number;
      items: IOrderItem[];
      status: IOrder["status"];
    }>
  >;
  onSubmit: (e: React.FormEvent) => void;
}

export default function AddOrderModal({
  isOpen,
  onClose,
  newOrder,
  setNewOrder,
  onSubmit,
}: AddOrderModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState<string[]>(
    newOrder.items.map(() => "")
  );
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{
    message: string;
    onConfirm?: () => void;
  } | null>(null);
  const [isCustomerValid, setIsCustomerValid] = useState<boolean | null>(null);
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

  // -----------------------------------------------------------------
  // FETCH PRODUCTS
  // -----------------------------------------------------------------
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/products`);
        setProducts(data);
      } catch {
        setError("Failed to fetch products");
        setAlert({ message: "Failed to fetch products" });
      }
    };
    fetchProducts();
  }, [API_BASE_URL]);

  // -----------------------------------------------------------------
  // FETCH ALL CUSTOMERS (for the <select>)
  // -----------------------------------------------------------------
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/customer`);
        setCustomers(data);
      } catch (err) {
        const msg =
          (err as AxiosError<{ errors?: string[]; message?: string }>).response
            ?.data?.errors?.join(", ") ||
          (err as AxiosError<{ errors?: string[]; message?: string }>).response
            ?.data?.message ||
          "Failed to fetch customers";
        setError(msg);
        setAlert({ message: msg });
      }
    };
    fetchAll();
  }, [API_BASE_URL]);

  // -----------------------------------------------------------------
  // SEARCH CUSTOMERS (no debounce)
  // -----------------------------------------------------------------
  useEffect(() => {
    const search = async () => {
      if (customerSearch.trim().length < 2) {
        // reload full list
        try {
          const { data } = await axios.get(`${API_BASE_URL}/customer`);
          setCustomers(data);
        } catch {}
        return;
      }
      try {
        const { data } = await axios.get(
          `${API_BASE_URL}/customer/query?page=1&limit=5&search=${encodeURIComponent(
            customerSearch
          )}&sortBy=customerName&sortOrder=desc`
        );
        setCustomers(data.customers);
      } catch {}
    };
    search();
  }, [customerSearch, API_BASE_URL]);

  // -----------------------------------------------------------------
  // HANDLE CUSTOMER SELECT
  // -----------------------------------------------------------------
  const handleCustomerChange = (customerId: string) => {
    const sel = customers.find((c) => c._id === customerId);
    setNewOrder({ ...newOrder, customerId });
    setIsCustomerValid(customerId.length >= 3);
    setCustomerSearch(sel ? sel.customerName : "");
  };

  // -----------------------------------------------------------------
  // VALIDATE CUSTOMER ID
  // -----------------------------------------------------------------
  const validateCustomerId = (id: string) => {
    const ok = id.length >= 3;
    setIsCustomerValid(ok);
    if (!ok) setAlert({ message: "Customer ID must be ≥ 3 characters." });
    return ok;
  };

  // -----------------------------------------------------------------
  // CALCULATE TOTAL
  // -----------------------------------------------------------------
  const calculateTotal = (items: IOrderItem[]) =>
    items.reduce((s, i) => s + i.price * i.quantity, 0);

  // -----------------------------------------------------------------
  // ITEM HANDLERS
  // -----------------------------------------------------------------
  const handleItemChange = (
    idx: number,
    field: keyof IOrderItem,
    value: string | number
  ) => {
    const items = [...newOrder.items];
    if (field === "productId") {
      const p = products.find((x) => x._id === value);
      items[idx] = {
        ...items[idx],
        productId: value as string,
        price: p ? p.price : 0,
        quantity:
          p && items[idx].quantity > p.stock ? 0 : items[idx].quantity,
      };
      if (p && items[idx].quantity > p.stock)
        setAlert({
          message: `Qty exceeds stock (${p.stock}) for ${p.name}.`,
        });
    } else if (field === "quantity") {
      const qty = parseInt(value as string) || 0;
      const p = products.find((x) => x._id === items[idx].productId);
      if (p && qty > p.stock) {
        setAlert({
          message: `Qty exceeds stock (${p.stock}) for ${p.name}.`,
        });
        return;
      }
      items[idx].quantity = qty;
    }
    setNewOrder({ ...newOrder, items, total: calculateTotal(items) });
  };

  const handleProductSearch = (idx: number, val: string) => {
    const s = [...productSearch];
    s[idx] = val;
    setProductSearch(s);
  };

  const addItem = () => {
    const items = [
      ...newOrder.items,
      { productId: "", quantity: 0, price: 0 },
    ];
    setNewOrder({ ...newOrder, items, total: calculateTotal(items) });
    setProductSearch([...productSearch, ""]);
  };

  const removeItem = (idx: number) => {
    const items = newOrder.items.filter((_, i) => i !== idx);
    setNewOrder({ ...newOrder, items, total: calculateTotal(items) });
    setProductSearch(productSearch.filter((_, i) => i !== idx));
  };

  const filteredProducts = (idx: number) =>
    productSearch[idx]
      ? products.filter(
          (p) =>
            p.name.toLowerCase().includes(productSearch[idx].toLowerCase()) ||
            p._id.toLowerCase().includes(productSearch[idx].toLowerCase())
        )
      : products;

  // -----------------------------------------------------------------
  // SUBMIT
  // -----------------------------------------------------------------
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCustomerId(newOrder.customerId)) return;
    if (newOrder.items.some((i) => !i.productId)) {
      setAlert({ message: "Every item must have a product." });
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
          {/* Customer */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Customer
            </label>
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 mb-1"
              placeholder="Search customer by name..."
            />
            <select
              value={newOrder.customerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${
                isCustomerValid === false ? "border-red-500" : ""
              }`}
              required
            >
              <option value="">Select a customer</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.customerName}
                </option>
              ))}
            </select>
            {isCustomerValid === false && (
              <p className="text-red-500 text-sm mt-1">
                Please select a valid customer
              </p>
            )}
          </div>

          {/* Total */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Total
            </label>
            <p className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-700">
              ${newOrder.total.toFixed(2)}
            </p>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              value={newOrder.status}
              onChange={(e) =>
                setNewOrder({
                  ...newOrder,
                  status: e.target.value as IOrder["status"],
                })
              }
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              {["pending", "shipped", "delivered", "cancelled"].map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Items */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Items
            </label>
            {newOrder.items.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row gap-2 mb-2"
              >
                <div className="w-full">
                  <input
                    type="text"
                    placeholder="Search product by name..."
                    value={productSearch[idx] || ""}
                    onChange={(e) => handleProductSearch(idx, e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 mb-1"
                  />
                  <select
                    value={item.productId}
                    onChange={(e) =>
                      handleItemChange(idx, "productId", e.target.value)
                    }
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a product</option>
                    {filteredProducts(idx).map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="number"
                  placeholder="Quantity"
                  value={item.quantity}
                  onChange={(e) =>
                    handleItemChange(idx, "quantity", parseInt(e.target.value) || 0)
                  }
                  className="w-full sm:w-24 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  min="0"
                  required
                />
                {newOrder.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="text-red-600 hover:text-red-800"
                  >
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

          {/* Buttons */}
          <div className="flex gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 w-full"
            >
              Add Order
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={onClose}
              className="bg-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400 w-full"
            >
              Cancel
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}