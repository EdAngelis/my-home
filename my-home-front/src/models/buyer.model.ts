import IProducts from "./products.model";

type Items = {
  product: IProducts;
  qt: number;
};

type Cart = {
  status: string;
  home?: string;
  items: Items[];
};

interface IBuyer {
  _id?: string;
  cpf: string;
  marketPhone?: string,
  cart?: Cart;
  homes?: string[];
  defaultHome?: string;
}

export default IBuyer;
