import { Alert, IAlert } from "../models/alert.model";

export const createAlert = async (alertData: Partial<IAlert>) => {
  const alert = new Alert({
    ...alertData,
    status: alertData.status || "pending",
    resolved: alertData.resolved || false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await alert.save();
  return alert;
};

export const getAlerts = async (limit = 50) => {
  return await Alert.find().sort({ createdAt: -1 }).limit(limit);
};

export const resolveAlert = async (id: string) => {
  return await Alert.findByIdAndUpdate(id, { resolved: true, updatedAt: new Date() }, { new: true });
};

export const deleteAlert = async (id: string) => {
  return await Alert.findByIdAndDelete(id);
};

export const deleteAllAlerts = async () => {
  await Alert.deleteMany({});
};