import { Category } from "../models";
import { ICategory } from "../models/categories.model";

const findMany = async (query: any) => {
  try {
    const categories = await Category.find(query);
    return categories;
  } catch (error) {
    throw error;
  }
};

const findOne = async (_id: string) => {
  try {
    const category = Category.findById(_id);
    return category;
  } catch (error) {
    throw error;
  }
};

const create = async (category: ICategory) => {
  try {
    const newCategory = await Category.create(category);
    return newCategory;
  } catch (error) {
    throw error;
  }
};

const createMany = async (categories: any[]) => {
  try {
    const newCategories = await Category.insertMany(categories);
    return newCategories;
  } catch (error) {
    throw error;
  }
};

const updateOne = async (_id: string, category: ICategory) => {
  try {
    const newCategory = Category.findByIdAndUpdate(_id, category);
    return newCategory;
  } catch (error) {
    throw error;
  }
};

const updateMany = async (query: any, toUpdate: ICategory) => {
  try {
    const newCategory = Category.updateMany(query, toUpdate);
    return newCategory;
  } catch (error) {
    throw error;
  }
};

const deleteOne = async (_id: string) => {
  try {
    const response = Category.findByIdAndDelete(_id);
    return response;
  } catch (error) {
    throw error;
  }
};

const deleteMany = async (query: any) => {
  try {
    const response = Category.deleteMany(query);
    return response;
  } catch (error) {
    throw error;
  }
};

export {
  findMany,
  createMany,
  create,
  findOne,
  updateOne,
  updateMany,
  deleteOne,
  deleteMany,
};
