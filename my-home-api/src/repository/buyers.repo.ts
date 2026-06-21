import { Buyer } from "../models";
import { IBuyer } from "../models/buyer.model";

const getByCpf = async (cpf: string) => {
  try {
    const buyer = await Buyer.findOne({ cpf }).populate("cart.items.product");
    return buyer;
  } catch (error) {
    throw error;
  }
}

const findMany = async (query: any) => {
  try {
    const buyers = await Buyer.find(query).populate("cart.items.product");
    return buyers;
  } catch (error) {
    throw error;
  }
};

const findOne = async (_id: string) => {
  try {
    const buyer = Buyer.findById(_id).populate("cart.items.product");
    return buyer;
  } catch (error) {
    throw error;
  }
};

const create = async (buyer: IBuyer) => {
  try {
    const newBuyer = await Buyer.create(buyer);
    return newBuyer;
  } catch (error) {
    throw error;
  }
};

const createMany = async (Buyers: IBuyer[]) => {
  try {
    const newBuyers = await Buyer.insertMany(Buyers);
    return newBuyers;
  } catch (error) {
    throw error;
  }
};

const updateOne = async (_id: string, buyer: IBuyer) => {
  try {
    const newBuyer = Buyer.findByIdAndUpdate(_id, buyer, {
      new: true,
    }).populate("cart.items.product");
    return newBuyer;
  } catch (error) {
    throw error;
  }
};

const updateMany = async (query: any, toUpdate: IBuyer) => {
  try {
    const newBuyer = Buyer.updateMany(query, toUpdate);
    return newBuyer;
  } catch (error) {
    throw error;
  }
};

const deleteOne = async (_id: string) => {
  try {
    const response = Buyer.findByIdAndDelete(_id);
    return response;
  } catch (error) {
    throw error;
  }
};

const deleteMany = async (query: any) => {
  try {
    const response = Buyer.deleteMany(query);
    return response;
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
  getByCpf
};
