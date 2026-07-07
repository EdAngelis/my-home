import { Request, Response } from "express";
import { response } from "../types/response-body.type";
import {
  findMany,
  findOne,
  updateOne,
  updateMany,
  deleteOne,
  deleteMany,
  createHome,
  joinHome,
  removeUserFromHome,
  listUserHomes,
  setDefaultHome,
} from "../repository/homes.repo";

const getHomes = async (req: Request, res: Response) => {
  const query = req.query;

  try {
    const data = await findMany(query);
    if (!data) return response(res, 404, { message: "Homes not found", data });

    return response(res, 200, { message: "All Homes", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

const getUserHomes = async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const data = await listUserHomes(userId);
    if (!data) return response(res, 404, { message: "Homes not found", data });

    return response(res, 200, { message: "User Homes", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

const getHome = async (req: Request, res: Response) => {
  try {
    const data = await findOne(req.params.id);

    if (!data) return response(res, 404, { message: "Home not found", data });

    return response(res, 200, { message: "Home found", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

const postCreateHome = async (req: Request, res: Response) => {
  const { name, userId } = req.body;

  try {
    const data = await createHome(name, userId);

    return response(res, 200, { message: "Home created", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

const postJoinHome = async (req: Request, res: Response) => {
  const { code, userId } = req.body;

  try {
    const data = await joinHome(code, userId);

    if (!data) return response(res, 404, { message: "Home not found", data });

    return response(res, 200, { message: "Home joined", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

const postLeaveHome = async (req: Request, res: Response) => {
  const { homeId, userId } = req.body;

  try {
    const data = await removeUserFromHome(homeId, userId);

    if (!data) return response(res, 404, { message: "Home not found", data });

    return response(res, 200, { message: "Home left", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

const deleteHomeUser = async (req: Request, res: Response) => {
  const { id, userId } = req.params;

  try {
    const data = await removeUserFromHome(id, userId);

    if (!data) return response(res, 404, { message: "Home not found", data });

    return response(res, 200, { message: "User removed from Home", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

const patchDefaultHome = async (req: Request, res: Response) => {
  const { userId, homeId } = req.body;

  try {
    const data = await setDefaultHome(userId, homeId);

    if (!data)
      return response(res, 404, {
        message: "Buyer not found or Home not associated with Buyer",
        data,
      });

    return response(res, 200, { message: "Default Home set", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

const updateHome = async (req: Request, res: Response) => {
  try {
    const data = await updateOne(req.params.id, req.body);

    if (!data) return response(res, 404, { message: "Home not found", data });

    return response(res, 200, { message: "Home updated", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

const updateHomes = async (req: Request, res: Response) => {
  const query = req.query;
  const toUpdate = req.body;

  try {
    const data = await updateMany(query, toUpdate);
    if (!data) return response(res, 404, { message: "Homes not found", data });

    return response(res, 200, { message: "Homes Updated", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

const deleteHome = async (req: Request, res: Response) => {
  const _id = req.params.id;
  try {
    const data = await deleteOne(_id);

    if (!data) return response(res, 404, { message: "Home not found", data });

    return response(res, 200, { message: "Home deleted", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

const deleteHomes = async (req: Request, res: Response) => {
  const query = req.query;

  try {
    const data = await deleteMany(query);
    if (!data) return response(res, 404, { message: "Homes not found", data });

    return response(res, 200, { message: "Homes Deleted", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

export {
  getHomes,
  getUserHomes,
  getHome,
  postCreateHome,
  postJoinHome,
  postLeaveHome,
  deleteHomeUser,
  patchDefaultHome,
  updateHome,
  updateHomes,
  deleteHome,
  deleteHomes,
};
