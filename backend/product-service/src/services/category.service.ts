import { Category, ICategory } from "../models/category.model";

export const createCategory = async (data: { name: string; description?: string }): Promise<ICategory> => {
    console.log("data from cateeeeeeeeeeee",data);
    
  const category = new Category(data);
  return category.save();
};

export const getCategories = async (): Promise<ICategory[]> => {
  return Category.find().sort({ name: 1 });
};

export const getCategoryById = async (id: string): Promise<ICategory | null> => {
  return Category.findById(id);
};
