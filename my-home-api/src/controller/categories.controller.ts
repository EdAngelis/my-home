import { Request, Response } from "express";
import { response } from "../types/response-body.type";
import {
  findMany,
  create,
  findOne,
  updateOne,
  updateMany,
  deleteOne,
  deleteMany,
} from "../repository/categories.repo";
import { Duty } from "../models";

const getCategories = async (req: Request, res: Response) => {
  const query = req.query;

  try {
    const data = await findMany(query);
    if (!data)
      return response(res, 404, { message: "Categories not found", data });

    return response(res, 200, { message: "All Categories", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

const getCategory = async (req: Request, res: Response) => {
  try {
    const data = await findOne(req.params.id);

    if (!data)
      return response(res, 404, { message: "Category not found", data });

    return response(res, 200, { message: "Category found", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

const createCategory = async (req: Request, res: Response) => {
  try {
    const data = await create(req.body);

    return response(res, 200, { message: "Category created", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

const updateCategory = async (req: Request, res: Response) => {
  try {
    const data = await updateOne(req.params.id, req.body);

    if (!data)
      return response(res, 404, { message: "Category not found", data });

    return response(res, 200, { message: "Category updated", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

const updateCategories = async (req: Request, res: Response) => {
  const query = req.query;
  const toUpdate = req.body;

  try {
    const data = await updateMany(query, toUpdate);
    if (!data)
      return response(res, 404, { message: "Categories not found", data });

    return response(res, 200, { message: "Categories Updated", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

const deleteCategory = async (req: Request, res: Response) => {
  const _id = req.params.id;
  try {
    const data = await deleteOne(_id);

    if (!data)
      return response(res, 404, { message: "Category not found", data });

    // Cascade: clear this category from any duty that referenced it.
    await Duty.updateMany({ category: _id }, { category: "" });

    return response(res, 200, { message: "Category deleted", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

const deleteCategories = async (req: Request, res: Response) => {
  const query = req.query;

  try {
    const data = await deleteMany(query);
    if (!data)
      return response(res, 404, { message: "Categories not found", data });

    return response(res, 200, { message: "Categories Deleted", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

export {
  getCategories,
  createCategory,
  getCategory,
  updateCategory,
  updateCategories,
  deleteCategory,
  deleteCategories,
};
