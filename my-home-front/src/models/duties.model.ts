type HistoryType = {
  date?: Date;
  maker?: string;
};

interface IDuties extends Document {
  _id?: string;
  cod: string;
  name: string;
  frequency: number;
  value: number;
  history: HistoryType[];
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export default IDuties;
