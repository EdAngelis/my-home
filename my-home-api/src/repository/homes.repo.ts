import { Home, Buyer } from "../models";
import { IHome } from "../models/home.model";

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

// Only 10,000 possible 4-digit codes ("0000"-"9999"). Retrying past a
// duplicate-key error keeps creation correct under a race, but the small key
// space means collisions become more likely as more Homes exist.
const MAX_CODE_ATTEMPTS = 10;

const generateCode = () =>
  Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");

const createHome = async (name: string, userId: string) => {
  let home;

  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    try {
      home = await Home.create({ name, code: generateCode(), users: [userId] });
      break;
    } catch (error: any) {
      if (error?.code !== 11000) throw error;
    }
  }

  if (!home) throw new Error("Could not generate a unique Home code");

  await Buyer.findByIdAndUpdate(userId, {
    $addToSet: { homes: home._id },
    defaultHome: home._id,
  });

  return home;
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

const clearDefaultHome = async (userId: string) => {
  try {
    const buyer = await Buyer.findByIdAndUpdate(
      userId,
      { defaultHome: "" },
      { new: true }
    );
    return buyer;
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

    if (!home) return null;

    const buyer = await Buyer.findByIdAndUpdate(
      userId,
      { $pull: { homes: homeId } },
      { new: true }
    );

    if (buyer?.defaultHome === homeId) {
      await Buyer.findByIdAndUpdate(userId, { defaultHome: "" });
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
  clearDefaultHome,
  removeUserFromHome,
  listUserHomes,
  setDefaultHome,
};
