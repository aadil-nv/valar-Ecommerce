import { motion } from "framer-motion";

interface AlertProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function Alert({ message, onConfirm, onCancel }: AlertProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl"
      >
        <p className="text-gray-800 mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 rounded-md hover:bg-gray-100 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
          >
            Confirm
          </button>
        </div>
      </motion.div>
    </div>
  );
}