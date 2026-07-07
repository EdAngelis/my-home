import { Buyer } from "../models";
import { Items } from "../models/buyer.model";

const pushItem = async (id: string, home: string, data: Items[]) => {
  try {
    const response = Buyer.updateOne(
      {
        _id: id,
        $or: [
          { "cart.home": home },
          { "cart.home": { $exists: false } },
          { "cart.home": null },
        ],
      },
      { $push: { "cart.items": { $each: data } }, $set: { "cart.home": home } }
    );

    return response;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const pullItem = async (id: string, home: string, productIds: string[]) => {
  try {
    const response = Buyer.updateOne(
      { _id: id, "cart.home": home },
      { $pull: { "cart.items": { product: { $in: productIds } } } }
    );

    return response;
  } catch (error) {
    throw error;
  }
};

export { pushItem, pullItem };
