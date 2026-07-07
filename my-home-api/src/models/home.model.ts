import { Document, Schema, model } from "mongoose";

interface IHome extends Document {
  name: string;
  code: string;
  users: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

const schema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  users: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Home = model<IHome>("Home", schema);

export { Home, IHome };
