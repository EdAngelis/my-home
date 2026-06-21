interface IProducts {
  _id: string;
  createdByUserId: string;
  cod: string;
  name: string;
  unit: string;
  badge: string;
  size: string;
  price: number;
  characteristic: string;
  description: string;
  image: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export default IProducts;
