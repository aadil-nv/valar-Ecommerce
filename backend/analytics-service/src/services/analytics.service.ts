import { Analytics, IAnalytics } from "../models/analytics.model";

export const saveAnalyticsEvent = async (event: Partial<IAnalytics>) => {    
  const analytics = new Analytics(event);
  await analytics.save();
  return analytics;
};

export const getRecentAnalytics = async (limit = 50) => {
  return await Analytics.find().sort({ timestamp: -1 }).limit(limit);
};
