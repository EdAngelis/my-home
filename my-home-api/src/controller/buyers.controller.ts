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
  getByCpf,
} from "../repository/buyers.repo";

const  signIn = async ( req: Request, res: Response) => {
   const { cpf } = req.query;
   try {
      const data = await getByCpf(cpf as string);
      if(!data) return response(res, 201, { message: "Buyer not found", data: data });

      return response(res, 200, { message: "Buyer found", data: data });
   } catch (error) {
      console.log(error);
      return response(res, 500, { message: "Error", data: error });
   }
}

const getBuyers = async (req: Request, res: Response) => {
  const query = req.query;

  try {
    const data = await findMany(query);
    if (!data) return response(res, 404, { message: "Buyers not found", data });

    return response(res, 200, { message: "All Buyers", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

const getBuyer = async (req: Request, res: Response) => {
  try {
    const data = await findOne(req.params.id);

    if (!data) return response(res, 404, { message: "Buyer not found", data });

    return response(res, 200, { message: "Buyer found", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

const signUp = async (req: Request, res: Response) => {
  try {
    const data = await create(req.body);

    return response(res, 200, { message: "Buyer created", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

const createBuyers = async (req: Request, res: Response) => {
  const body = req.body;
  try {
    const data = await createMany(body);

    if (!data)
      return response(res, 500, {
        message: "Problem creating the buyers",
        data,
      });

    return response(res, 200, { message: "Buyers created", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

const updateBuyer = async (req: Request, res: Response) => {
  const body = req.body;
  try {
    const data = await updateOne(req.params.id, body);

    if (!data) return response(res, 404, { message: "Buyer not found", data });

    return response(res, 200, { message: "Buyer updated", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

const updateBuyers = async (req: Request, res: Response) => {
  const query = req.query;
  const toUpdate = req.body;

  try {
    const data = await updateMany(query, toUpdate);
    if (!data) return response(res, 404, { message: "Buyers not found", data });

    return response(res, 200, { message: "Buyers Updated", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

const deleteBuyer = async (req: Request, res: Response) => {
  const _id = req.params.id;
  try {
    const data = await deleteOne(_id);

    if (!data) return response(res, 404, { message: "Buyer not found", data });

    return response(res, 200, { message: "Buyer deleted", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

const deleteBuyers = async (req: Request, res: Response) => {
  const query = req.query;

  try {
    const data = await deleteMany(query);
    if (!data) return response(res, 404, { message: "Buyers not found", data });

    return response(res, 200, { message: "Buyers Deleted", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

export {
  getBuyers,
  createBuyers,
  signUp,
  getBuyer,
  updateBuyer,
  updateBuyers,
  deleteBuyer,
  deleteBuyers,
  signIn
};
