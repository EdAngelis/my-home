import { Document, Schema, model } from "mongoose";

interface ICategory extends Document {
  name: string;
  createdByUserId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const schema = new Schema({
  name: { type: String, required: true },
  createdByUserId: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Category = model<ICategory>("Categories", schema);

export { Category, ICategory };
