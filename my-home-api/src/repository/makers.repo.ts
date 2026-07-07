import { Maker } from "../models";
import { IMaker } from "../models/makers.model";

const findMany = async (query: any) => {
  try {
    const makers = await Maker.find(query);
    return makers;
  } catch (error) {
    throw error;
  }
};

const findOne = async (_id: string, query: any) => {
  try {
    const maker = Maker.findOne({ _id, ...query });
    return maker;
  } catch (error) {
    throw error;
  }
};

const create = async (maker: IMaker) => {
  try {
    const newMaker = await Maker.create(maker);
    return newMaker;
  } catch (error) {
    throw error;
  }
};

const createMany = async (makers: any[]) => {
  try {
    const newMakers = await Maker.insertMany(makers);
    return newMakers;
  } catch (error) {
    throw error;
  }
};

const updateOne = async (_id: string, query: any, maker: IMaker) => {
  try {
    const newMaker = Maker.findOneAndUpdate({ _id, ...query }, maker);
    return newMaker;
  } catch (error) {
    throw error;
  }
};

const updateMany = async (query: any, toUpdate: IMaker) => {
  try {
    const newMaker = Maker.updateMany(query, toUpdate);
    return newMaker;
  } catch (error) {
    throw error;
  }
};

const deleteOne = async (_id: string, query: any) => {
  try {
    const response = Maker.findOneAndDelete({ _id, ...query });
    return response;
  } catch (error) {
    throw error;
  }
};

const deleteMany = async (query: any) => {
  try {
    const response = Maker.deleteMany(query);
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
};
