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
} from "../repository/makers.repo";
import { Duty } from "../models";

const getMakers = async (req: Request, res: Response) => {
  const query = req.query;

  try {
    const data = await findMany(query);
    if (!data) return response(res, 404, { message: "Makers not found", data });

    return response(res, 200, { message: "All Makers", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

const getMaker = async (req: Request, res: Response) => {
  try {
    const data = await findOne(req.params.id);

    if (!data) return response(res, 404, { message: "Maker not found", data });

    return response(res, 200, { message: "Maker found", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

const createMaker = async (req: Request, res: Response) => {
  try {
    const data = await create(req.body);

    return response(res, 200, { message: "Maker created", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

const updateMaker = async (req: Request, res: Response) => {
  try {
    const data = await updateOne(req.params.id, req.body);

    if (!data) return response(res, 404, { message: "Maker not found", data });

    return response(res, 200, { message: "Maker updated", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

const updateMakers = async (req: Request, res: Response) => {
  const query = req.query;
  const toUpdate = req.body;

  try {
    const data = await updateMany(query, toUpdate);
    if (!data) return response(res, 404, { message: "Makers not found", data });

    return response(res, 200, { message: "Makers Updated", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

const deleteMaker = async (req: Request, res: Response) => {
  const _id = req.params.id;
  try {
    const data = await deleteOne(_id);

    if (!data) return response(res, 404, { message: "Maker not found", data });

    // Cascade: pull this maker's id from every duty's makers array.
    await Duty.updateMany({ makers: _id }, { $pull: { makers: _id } });

    return response(res, 200, { message: "Maker deleted", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

const deleteMakers = async (req: Request, res: Response) => {
  const query = req.query;

  try {
    const data = await deleteMany(query);
    if (!data) return response(res, 404, { message: "Makers not found", data });

    return response(res, 200, { message: "Makers Deleted", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

export {
  getMakers,
  createMaker,
  getMaker,
  updateMaker,
  updateMakers,
  deleteMaker,
  deleteMakers,
};
