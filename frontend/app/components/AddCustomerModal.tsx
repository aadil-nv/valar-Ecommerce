import type{ Dispatch, SetStateAction, FormEvent } from "react";
import { motion } from "framer-motion";

interface CustomerFormData {
  customerName: string;
  email: string;
  phone: string;
  isBlocked: boolean;
}

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  newCustomer: CustomerFormData;
  setNewCustomer: Dispatch<SetStateAction<CustomerFormData>>;
  onSubmit: (e: FormEvent) => Promise<void>;
}

export default function AddCustomerModal({
  isOpen,
  onClose,
  newCustomer,
  setNewCustomer,
  onSubmit,
}: AddCustomerModalProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.8 }}
        className="bg-white rounded-lg p-6 w-full max-w-md"
      >
        <h2 className="text-xl font-bold mb-4">Add New Customer</h2>
        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={newCustomer.customerName}
              onChange={(e) =>
                setNewCustomer({ ...newCustomer, customerName: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="Enter customer name"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={newCustomer.email}
              onChange={(e) =>
                setNewCustomer({ ...newCustomer, email: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="Enter email"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="text"
              value={newCustomer.phone}
              onChange={(e) =>
                setNewCustomer({ ...newCustomer, phone: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="Enter phone number"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Blocked</label>
            <input
              type="checkbox"
              checked={newCustomer.isBlocked}
              onChange={(e) =>
                setNewCustomer({ ...newCustomer, isBlocked: e.target.checked })
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          <div className="flex justify-end gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Customer
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}