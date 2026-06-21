import { Buyer } from "../models";
import { Items } from "../models/buyer.model";

const pushItem = async (id: string, data: Items[]) => {
  try {
    const response = Buyer.updateOne(
      { _id: id },
      { $push: { "cart.items": { $each: data } } }
    );

    return response;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const pullItem = async (id: string, data: Items[]) => {
  try {
    const response = Buyer.updateOne(
      { _id: id },
      { $pull: { "cart.product": { $in: data } } }
    );

    return response;
  } catch (error) {
    throw error;
  }
};

export { pushItem, pullItem };
