import IProducts from "./products.model";

type Items = {
  product: IProducts;
  qt: number;
};

type Cart = {
  status: string;
  items: Items[];
};

interface IBuyer {
  _id?: string;
  cpf: string;
  marketPhone?: string,
  cart?: Cart;
}

export default IBuyer;
