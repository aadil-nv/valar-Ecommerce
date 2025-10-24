import { Alert, IAlert } from "../models/alert.model";

export const createAlert = async (alertData: Partial<IAlert>) => {
  const alert = new Alert(alertData);
  await alert.save();
  return alert;
};

export const getAlerts = async (limit = 50) => {
  return await Alert.find().sort({ timestamp: -1 }).limit(limit);
};

export const resolveAlert = async (id: string) => {
  return await Alert.findByIdAndUpdate(id, { resolved: true }, { new: true });
};
