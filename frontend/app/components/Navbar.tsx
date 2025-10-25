import { useState, useEffect } from "react";
import { Menu, X, Home, Package, ShoppingCart, Bell, Search, User, Settings, LogOut, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios, { AxiosError } from "axios";
import Alert from "../components/Alert";

interface IAlert {
  _id: string;
  type: "low" | "medium" | "high" | "critical" | string;
  message: string;
  status: "pending" | "sent" | "failed";
  resolved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavbarProps {
  onMenuClick: () => void;
}

interface ErrorResponse {
  error?: { error: string };
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const [alerts, setAlerts] = useState<IAlert[]>([]);
  const [isAlertDropdownOpen, setIsAlertDropdownOpen] = useState(false);
  const [confirmationAlert, setConfirmationAlert] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
  const WS_URL = import.meta.env.VITE_ALERT_WS_URL as string;
  console.log("aaaaaaaaaa",WS_URL );
  
  console.log("Nav bar ws base url is ",WS_URL);
  

  // Fetch alerts on mount
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/alerts`);
        setAlerts(response.data.alerts || []);
      } catch (err) {
        const errorMessage = (err as AxiosError<ErrorResponse>).response?.data?.error?.error || "Failed to fetch alerts";
        // toast.error(errorMessage);
        setAlerts([]);
      }
    };

    fetchAlerts();
  }, [API_BASE_URL]);

  // Setup WebSocket connection
// In Navbar.tsx
useEffect(() => {
  const ws = new WebSocket(WS_URL); // e.g., ws://localhost:8081

  ws.onopen = () => {
    console.log("Nav bar WebSocket connected");
  };

  ws.onmessage = (event) => {
    console.log("Received WebSocket message:", event.data);
    try {
      const message = JSON.parse(event.data);
      console.log("Parsed WebSocket message:", message);
      switch (message.event) {
        case "connection_test":
          console.log("Connection test message:", message.data.message);
          break;
        case "new_alert":
          setAlerts((prev) => [message.data, ...prev].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          // toast.info(`New alert: ${message.data.message}`);
          break;
        case "update_alert":
          setAlerts((prev) =>
            prev.map((alert) => (alert._id === message.data._id ? { ...alert, ...message.data } : alert))
          );
          break;
        case "delete_alert":
          setAlerts((prev) => prev.filter((alert) => alert._id !== message.data));
          break;
        case "clear_alerts":
          setAlerts([]);
          break;
        default:
          console.warn("Unknown WebSocket event:", message.event);
      }
    } catch (error) {
      console.error("Failed to parse WebSocket message:", error);
    }
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
    // toast.error("WebSocket connection error");
  };

  ws.onclose = () => {
    console.log("Nav bar WebSocket disconnected");
  };

  return () => {
    ws.close();
  };
}, [WS_URL]);

  // Count unresolved alerts
  const unresolvedAlertCount = alerts.filter((alert) => !alert.resolved).length;

  // Handle mark as resolved
  const handleMarkResolved = async (alertId: string) => {
    setConfirmationAlert({
      message: "Are you sure you want to mark this alert as resolved?",
      onConfirm: async () => {
        try {
          await axios.patch(`${API_BASE_URL}/alerts/${alertId}/resolve`);
          setAlerts(alerts.map((alert) => (alert._id === alertId ? { ...alert, resolved: true, updatedAt: new Date() } : alert)));
          toast.success("Alert marked as resolved");
          setConfirmationAlert(null);
        } catch (err) {
          const errorMessage = (err as AxiosError<ErrorResponse>).response?.data?.error?.error || "Failed to mark alert as resolved";
          toast.error(errorMessage);
          setConfirmationAlert(null);
        }
      },
    });
  };

  // Handle clear single alert
  const handleClearAlert = async (alertId: string) => {
    setConfirmationAlert({
      message: "Are you sure you want to clear this alert?",
      onConfirm: async () => {
        try {
          await axios.delete(`${API_BASE_URL}/alerts/${alertId}`);
          setAlerts(alerts.filter((alert) => alert._id !== alertId));
          toast.success("Alert cleared successfully");
          setConfirmationAlert(null);
        } catch (err) {
          const errorMessage = (err as AxiosError<ErrorResponse>).response?.data?.error?.error || "Failed to clear alert";
          toast.error(errorMessage);
          setConfirmationAlert(null);
        }
      },
    });
  };

  // Handle clear all alerts
  const handleClearAllAlerts = async () => {
    setConfirmationAlert({
      message: "Are you sure you want to clear all alerts?",
      onConfirm: async () => {
        try {
          await axios.delete(`${API_BASE_URL}/alerts`);
          setAlerts([]);
          toast.success("All alerts cleared successfully");
          setConfirmationAlert(null);
        } catch (err) {
          const errorMessage = (err as AxiosError<ErrorResponse>).response?.data?.error?.error || "Failed to clear all alerts";
          toast.error(errorMessage);
          setConfirmationAlert(null);
        }
      },
    });
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} closeOnClick draggable pauseOnHover />
      <div className="flex items-center justify-between px-4 py-4 md:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="md:hidden text-gray-700 hover:text-gray-900 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu size={24} />
          </button>

          {/* Search Bar */}
          <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2 w-80">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search products, orders..."
              className="bg-transparent border-none outline-none text-sm w-full text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Center - Title */}
        <h1 className="hidden lg:block text-xl font-bold text-gray-800">
          E-commerce Dashboard
        </h1>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setIsAlertDropdownOpen(!isAlertDropdownOpen)}
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell size={22} />
              {unresolvedAlertCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-semibold rounded-full flex items-center justify-center">
                  {unresolvedAlertCount}
                </span>
              )}
            </button>

            {/* Alert Dropdown */}
            <AnimatePresence>
              {isAlertDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
                >
                  <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800">Alerts</h3>
                    {alerts.length > 0 && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleClearAllAlerts}
                        className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
                      >
                        <Trash2 size={16} /> Clear All
                      </motion.button>
                    )}
                  </div>
                  {alerts.length === 0 ? (
                    <p className="p-4 text-sm text-gray-500">No alerts available</p>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {alerts.map((alert) => (
                        <li key={alert._id} className="p-4 flex flex-col gap-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-gray-800">{alert.message}</p>
                              <p className="text-xs text-gray-500">
                                Type: <span className="capitalize">{alert.type}</span> | Created: {new Date(alert.createdAt).toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500">
                                Status: <span className="capitalize">{alert.status}</span>
                              </p>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleClearAlert(alert._id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 size={16} />
                            </motion.button>
                          </div>
                          {!alert.resolved && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleMarkResolved(alert._id)}
                              className="text-blue-600 hover:text-blue-800 text-xs"
                            >
                              Mark Resolved
                            </motion.button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile */}
          <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
            <div className="hidden md:block text-right">
              <p className="text-sm font-semibold text-gray-800">John Doe</p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
            <div className="relative">
              <img
                src="https://i.pravatar.cc/40"
                alt="User"
                className="w-10 h-10 rounded-full border-2 border-blue-500 shadow-md"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="md:hidden px-4 pb-3">
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent border-none outline-none text-sm w-full text-gray-700"
          />
        </div>
      </div>

      {/* Confirmation Alert */}
      <AnimatePresence>
        {confirmationAlert && (
          <Alert
            message={confirmationAlert.message}
            onConfirm={confirmationAlert.onConfirm}
            onCancel={() => setConfirmationAlert(null)}
          />
        )}
      </AnimatePresence>
    </header>
  );
}