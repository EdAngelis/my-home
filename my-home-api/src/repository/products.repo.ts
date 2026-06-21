import { Product } from "../models";
import Products from "../models/products";
import { IProducts } from "../models/products.model";

const findMany = async (query: any) => {
  try {
    const products = await Product.find(query);
    return products;
  } catch (error) {
    throw error;
  }
};

const findOne = async (_id: string) => {
  try {
    const product = Product.findById(_id);
    return product;
  } catch (error) {
    throw error;
  }
};

const create = async (product: IProducts) => {
  try {
    console.log(product);
    const newProduct = await Product.create(product);
    return newProduct;
  } catch (error) {
    throw error;
  }
};

const createMany = async () => {
  try {
    const newProducts = await Product.insertMany(Products);
    return newProducts;
  } catch (error) {
    throw error;
  }
};

const updateOne = async (_id: string, product: IProducts) => {
  try {
    const newProduct = Product.findByIdAndUpdate(_id, product);
    return newProduct;
  } catch (error) {
    throw error;
  }
};

const updateMany = async (query: any, toUpdate: IProducts) => {
  try {
    const newProduct = Product.updateMany(query, toUpdate);
    return newProduct;
  } catch (error) {
    throw error;
  }
};

const deleteOne = async (_id: string) => {
  try {
    const response = Product.findByIdAndDelete(_id);
    return response;
  } catch (error) {
    throw error;
  }
};

const deleteMany = async (query: any) => {
  try {
    const response = Product.deleteMany(query);
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
