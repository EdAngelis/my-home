type HistoryType = {
  date?: Date;
  maker?: string;
};

interface IDuties {
  _id?: string;
  cod: string;
  name: string;
  frequency: number;
  value: number;
  history: HistoryType[];
  description: string;
  createdByUserId?: string;
  home: string;
  category?: string;
  makers?: string[];
  status?: "active" | "paused";
  createdAt?: Date;
  updatedAt?: Date;
}

export default IDuties;
