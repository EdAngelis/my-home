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
  const { home } = req.query;
  if (!home) return null;
  return { home };
};

const getMakers = async (req: Request, res: Response) => {
  const query = req.query;

  try {
    if (!query.home)
      return response(res, 400, { message: "home is required", data: null });

    const data = await findMany({ home: query.home });
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
        message: "home is required",
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
        message: "home is required",
        data: null,
      });

    const maker = { ...req.body };
    delete maker.createdByUserId;
    const data = await updateOne(req.params.id, scope, {
      ...maker,
      home: scope.home,
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
    if (!query.home)
      return response(res, 400, { message: "home is required", data: null });

    const maker = { ...toUpdate };
    delete maker.createdByUserId;
    const data = await updateMany(
      { home: query.home },
      {
      ...maker,
      home: query.home,
      }
    );
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
        message: "home is required",
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
    if (!query.home)
      return response(res, 400, { message: "home is required", data: null });

    const data = await deleteMany({ home: query.home });
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
