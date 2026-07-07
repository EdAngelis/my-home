import { Home, Buyer } from "../models";
import { IHome } from "../models/home.model";

const generateCode = async (): Promise<string> => {
  let code = "";
  let exists = true;

  while (exists) {
    code = Math.floor(1000 + Math.random() * 9000).toString();
    exists = !!(await Home.findOne({ code }));
  }

  return code;
};

const findMany = async (query: any) => {
  try {
    const homes = await Home.find(query);
    return homes;
  } catch (error) {
    throw error;
  }
};

const findOne = async (_id: string) => {
  try {
    const home = await Home.findById(_id);
    return home;
  } catch (error) {
    throw error;
  }
};

const create = async (home: IHome) => {
  try {
    const newHome = await Home.create(home);
    return newHome;
  } catch (error) {
    throw error;
  }
};

const createMany = async (homes: any[]) => {
  try {
    const newHomes = await Home.insertMany(homes);
    return newHomes;
  } catch (error) {
    throw error;
  }
};

const updateOne = async (_id: string, home: IHome) => {
  try {
    const newHome = await Home.findByIdAndUpdate(_id, home, { new: true });
    return newHome;
  } catch (error) {
    throw error;
  }
};

const updateMany = async (query: any, toUpdate: IHome) => {
  try {
    const newHome = await Home.updateMany(query, toUpdate);
    return newHome;
  } catch (error) {
    throw error;
  }
};

const deleteOne = async (_id: string) => {
  try {
    const response = await Home.findByIdAndDelete(_id);
    return response;
  } catch (error) {
    throw error;
  }
};

const deleteMany = async (query: any) => {
  try {
    const response = await Home.deleteMany(query);
    return response;
  } catch (error) {
    throw error;
  }
};

const createHome = async (name: string, userId: string) => {
  try {
    const code = await generateCode();
    const home = await Home.create({ name, code, users: [userId] });

    await Buyer.findByIdAndUpdate(userId, {
      $addToSet: { homes: home._id },
      defaultHome: home._id,
    });

    return home;
  } catch (error) {
    throw error;
  }
};

const joinHome = async (code: string, userId: string) => {
  try {
    const home = await Home.findOneAndUpdate(
      { code },
      { $addToSet: { users: userId } },
      { new: true }
    );

    if (!home) return null;

    await Buyer.findByIdAndUpdate(userId, {
      $addToSet: { homes: home._id },
      defaultHome: home._id,
    });

    return home;
  } catch (error) {
    throw error;
  }
};

const removeUserFromHome = async (homeId: string, userId: string) => {
  try {
    const home = await Home.findByIdAndUpdate(
      homeId,
      { $pull: { users: userId } },
      { new: true }
    );

    const buyer = await Buyer.findByIdAndUpdate(
      userId,
      { $pull: { homes: homeId } },
      { new: true }
    );

    if (buyer && buyer.defaultHome === homeId) {
      const nextDefault = buyer.homes?.[0] ?? "";
      await Buyer.findByIdAndUpdate(userId, { defaultHome: nextDefault });
    }

    return home;
  } catch (error) {
    throw error;
  }
};

const listUserHomes = async (userId: string) => {
  try {
    const homes = await Home.find({ users: userId });
    return homes;
  } catch (error) {
    throw error;
  }
};

const setDefaultHome = async (userId: string, homeId: string) => {
  try {
    const buyer = await Buyer.findById(userId);
    if (!buyer || !buyer.homes?.includes(homeId)) return null;

    const updated = await Buyer.findByIdAndUpdate(
      userId,
      { defaultHome: homeId },
      { new: true }
    );
    return updated;
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
  createHome,
  joinHome,
  removeUserFromHome,
  listUserHomes,
  setDefaultHome,
};
