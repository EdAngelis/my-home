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

const getScope = (req: Request) => {
  const { home } = req.query;
  if (!home) return null;
  return { home };
};

const getCategories = async (req: Request, res: Response) => {
  const query = req.query;

  try {
    if (!query.home)
      return response(res, 400, { message: "home is required", data: null });

    const data = await findMany({ home: query.home });
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
    const scope = getScope(req);
    if (!scope)
      return response(res, 400, {
        message: "home is required",
        data: null,
      });

    const data = await findOne(req.params.id, scope);

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
    if (!req.body.createdByUserId)
      return response(res, 400, {
        message: "createdByUserId is required",
        data: null,
      });
    if (!req.body.home)
      return response(res, 400, { message: "home is required", data: null });

    const data = await create(req.body);

    return response(res, 200, { message: "Category created", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

const updateCategory = async (req: Request, res: Response) => {
  try {
    const scope = getScope(req);
    if (!scope)
      return response(res, 400, {
        message: "home is required",
        data: null,
      });

    const category = { ...req.body };
    delete category.createdByUserId;
    const data = await updateOne(req.params.id, scope, {
      ...category,
      home: scope.home,
    });

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
    if (!query.home)
      return response(res, 400, { message: "home is required", data: null });

    const category = { ...toUpdate };
    delete category.createdByUserId;
    const data = await updateMany(
      { home: query.home },
      {
      ...category,
      home: query.home,
      }
    );
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
    const scope = getScope(req);
    if (!scope)
      return response(res, 400, {
        message: "home is required",
        data: null,
      });

    const data = await deleteOne(_id, scope);

    if (!data)
      return response(res, 404, { message: "Category not found", data });

    // Cascade: clear this category from any duty that referenced it.
    await Duty.updateMany({ category: _id, ...scope }, { category: "" });

    return response(res, 200, { message: "Category deleted", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

const deleteCategories = async (req: Request, res: Response) => {
  const query = req.query;

  try {
    if (!query.home)
      return response(res, 400, { message: "home is required", data: null });

    const data = await deleteMany({ home: query.home });
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
