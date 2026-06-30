import { Document, Schema, model } from "mongoose";

interface IMaker extends Document {
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

const Maker = model<IMaker>("Makers", schema);

export { Maker, IMaker };
