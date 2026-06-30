import { Document, Schema, model } from "mongoose";

type History = {
  date?: Date;
  maker?: string;
};

interface IDuties extends Document {
  cod: string;
  name: string;
  frequency: number;
  value: number;
  history: History[];
  description: string;
  createdByUserId?: string;
  category?: string;
  makers?: string[];
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const schema = new Schema({
  cod: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  frequency: { type: Number, required: true },
  value: { type: Number, required: true, default: 1 },
  history: [
    {
      date: { type: Date },
      maker: { type: String },
    },
  ],
  description: { type: String },
  createdByUserId: { type: String },
  category: { type: String },
  makers: { type: [String], default: [] },
  status: { type: String, enum: ["active", "paused"], default: "active" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Duty = model<IDuties>("Duties", schema);

export { Duty, IDuties };
