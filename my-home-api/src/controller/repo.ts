import { ProductType, CartType } from "../types";

const printProducts = (
  products: ProductType[],
  category: string | null = null
) => {
  const nameAndCod = products.map((product) => {
    return { name: product.name, cod: product.cod };
  });
  console.log(nameAndCod);
};
const total = (shop: CartType[], products: ProductType[]) => {
  let total = 0;
  shop.forEach((product) => {
    const price = products.find((p: ProductType) => p.cod === product.cod)
      ?.price!;

    total += product.qt * price;
  });
  console.log("");
  console.log(`   Total da Compra R$ ${total.toFixed(2)}`);
};

const generateShopMessage = (shop: CartType[], products: ProductType[]) => {
  shop.forEach((product) => {
    const item = products.find((p: ProductType) => p.cod === product.cod);
    console.log(
      ` ${item?.name} ${item?.marca} ${item?.characteristic || ""} ${
        item?.size || ""
      } - ${product.qt} ${item?.unit}`
    );
  });
};

export { printProducts, total, generateShopMessage };
