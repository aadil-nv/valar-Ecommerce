// utils/generateOrderId.ts
export const generateOrderId = (): string => {
  // Example: ORD-XXXXXX (random 6 digit alphanumeric)
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "ORD-";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};
