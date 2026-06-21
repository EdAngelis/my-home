import { Duty } from "../models";
import { IDuties } from "../models/duties.model";

const findMany = async (query: any) => {
  try {
    const duties = await Duty.find(query);
    return duties;
  } catch (error) {
    throw error;
  }
};

const findOne = async (_id: string) => {
  try {
    const duty = Duty.findById(_id);
    return duty;
  } catch (error) {
    throw error;
  }
};

const create = async (duty: IDuties) => {
  try {
    const newDuty = await Duty.create(duty);
    return newDuty;
  } catch (error) {
    throw error;
  }
};

const createMany = async (duties: any[]) => {
  try {
    const newDuties = await Duty.insertMany(duties);
    return newDuties;
  } catch (error) {
    throw error;
  }
};

const updateOne = async (_id: string, duty: IDuties) => {
  try {
    const newDuty = Duty.findByIdAndUpdate(_id, duty);
    return newDuty;
  } catch (error) {
    throw error;
  }
};

const updateMany = async (query: any, toUpdate: IDuties) => {
  try {
    const newDuty = Duty.updateMany(query, toUpdate);
    return newDuty;
  } catch (error) {
    throw error;
  }
};

const deleteOne = async (_id: string) => {
  try {
    const response = Duty.findByIdAndDelete(_id);
    return response;
  } catch (error) {
    throw error;
  }
};

const deleteMany = async (query: any) => {
  try {
    const response = Duty.deleteMany(query);
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
