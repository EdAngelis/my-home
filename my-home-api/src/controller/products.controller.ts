import { Request, Response } from "express";
import { response } from "../types/response-body.type";
import {
  findMany,
  createMany,
  create,
  findOne,
  updateOne,
  updateMany,
  deleteOne,
  deleteMany,
} from "../repository/products.repo";

const getProducts = async (req: Request, res: Response) => {
  const query = req.query;

  try {
    const data = await findMany(query);
    if (!data)
      return response(res, 404, { message: "Products not found", data });

    return response(res, 200, { message: "All Products", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

const getProduct = async (req: Request, res: Response) => {
  try {
    const data = await findOne(req.params.id);

    if (!data)
      return response(res, 404, { message: "Product not found", data });

    return response(res, 200, { message: "Product found", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

const createProduct = async (req: Request, res: Response) => {
  try {
    const data = await create(req.body);

    return response(res, 200, { message: "Product created", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

const createProducts = async (req: Request, res: Response) => {
  try {
    const data = await createMany();

    if (!data)
      return response(res, 500, {
        message: "Problem creating the products",
        data,
      });

    return response(res, 200, { message: "Products created", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

const updateProduct = async (req: Request, res: Response) => {
  try {
    const data = await updateOne(req.params.id, req.body);

    if (!data)
      return response(res, 404, { message: "Product not found", data });

    return response(res, 200, { message: "Product updated", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

const updateProducts = async (req: Request, res: Response) => {
  const query = req.query;
  const toUpdate = req.body;

  try {
    const data = await updateMany(query, toUpdate);
    if (!data)
      return response(res, 404, { message: "Products not found", data });

    return response(res, 200, { message: "Products Updated", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

const deleteProduct = async (req: Request, res: Response) => {
  const _id = req.params.id;
  try {
    const data = await deleteOne(_id);

    if (!data)
      return response(res, 404, { message: "Product not found", data });

    return response(res, 200, { message: "Product deleted", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

const deleteProducts = async (req: Request, res: Response) => {
  const query = req.query;

  try {
    const data = await deleteMany(query);
    if (!data)
      return response(res, 404, { message: "Products not found", data });

    return response(res, 200, { message: "Products Deleted", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

export {
  getProducts,
  createProducts,
  createProduct,
  getProduct,
  updateProduct,
  updateProducts,
  deleteProduct,
  deleteProducts,
};
