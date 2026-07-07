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

const getScope = (req: Request) => {
  const { createdByUserId, home } = req.query;
  if (!createdByUserId || !home) return null;
  return { createdByUserId, home };
};

const getMakers = async (req: Request, res: Response) => {
  const query = req.query;

  try {
    if (!query.createdByUserId)
      return response(res, 400, {
        message: "createdByUserId is required",
        data: null,
      });
    if (!query.home)
      return response(res, 400, { message: "home is required", data: null });

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
    const scope = getScope(req);
    if (!scope)
      return response(res, 400, {
        message: "createdByUserId and home are required",
        data: null,
      });

    const data = await findOne(req.params.id, scope);

    if (!data) return response(res, 404, { message: "Maker not found", data });

    return response(res, 200, { message: "Maker found", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

const createMaker = async (req: Request, res: Response) => {
  try {
    if (!req.body.createdByUserId)
      return response(res, 400, {
        message: "createdByUserId is required",
        data: null,
      });
    if (!req.body.home)
      return response(res, 400, { message: "home is required", data: null });

    const data = await create(req.body);

    return response(res, 200, { message: "Maker created", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

const updateMaker = async (req: Request, res: Response) => {
  try {
    const scope = getScope(req);
    if (!scope)
      return response(res, 400, {
        message: "createdByUserId and home are required",
        data: null,
      });

    const data = await updateOne(req.params.id, scope, {
      ...req.body,
      ...scope,
    });

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
    if (!query.createdByUserId)
      return response(res, 400, {
        message: "createdByUserId is required",
        data: null,
      });
    if (!query.home)
      return response(res, 400, { message: "home is required", data: null });

    const data = await updateMany(query, {
      ...toUpdate,
      createdByUserId: query.createdByUserId,
      home: query.home,
    });
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
    const scope = getScope(req);
    if (!scope)
      return response(res, 400, {
        message: "createdByUserId and home are required",
        data: null,
      });

    const data = await deleteOne(_id, scope);

    if (!data) return response(res, 404, { message: "Maker not found", data });

    // Cascade: pull this maker's id from every duty's makers array.
    await Duty.updateMany({ makers: _id, ...scope }, { $pull: { makers: _id } });

    return response(res, 200, { message: "Maker deleted", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

const deleteMakers = async (req: Request, res: Response) => {
  const query = req.query;

  try {
    if (!query.createdByUserId)
      return response(res, 400, {
        message: "createdByUserId is required",
        data: null,
      });
    if (!query.home)
      return response(res, 400, { message: "home is required", data: null });

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
