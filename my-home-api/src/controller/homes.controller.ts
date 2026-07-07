import { Request, Response } from "express";
import { response } from "../types/response-body.type";
import {
  findOne,
  updateOne,
  updateMany,
  deleteOne,
  deleteMany,
  createHome,
  joinHome,
  clearDefaultHome,
  removeUserFromHome,
  listUserHomes,
  setDefaultHome,
} from "../repository/homes.repo";

const getHomes = async (req: Request, res: Response) => {
  const { userId } = req.query;

  try {
    if (!userId)
      return response(res, 400, { message: "userId is required", data: null });

    const data = await listUserHomes(userId as string);

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
  const { userId } = req.body;

  try {
    const data = await clearDefaultHome(userId);

    if (!data) return response(res, 404, { message: "Buyer not found", data });

    return response(res, 200, { message: "Default Home cleared", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

const postRemoveUser = async (req: Request, res: Response) => {
  const { homeId } = req.params;
  const { userId } = req.body;

  try {
    const data = await removeUserFromHome(homeId, userId);

    if (!data) return response(res, 404, { message: "Home not found", data });

    return response(res, 200, { message: "User removed from Home", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

const postSetDefaultHome = async (req: Request, res: Response) => {
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
  getHome,
  postCreateHome,
  postJoinHome,
  postLeaveHome,
  postRemoveUser,
  postSetDefaultHome,
  updateHome,
  updateHomes,
  deleteHome,
  deleteHomes,
};
