import api from "./service/api";
import IBuyer from "./models/buyer.model";
import IDuties from "./models/duties.model";
import IProduct from "./models/products.model";

const createBuyer = async (buyer: IBuyer) => {

  const response = await api.post("/buyers", buyer);
  return response;
}

const getProducts = async () => {
  const response = await api.get("/products");
  return response.data.data;
};

const getDuties = async () => {
  const response = await api.get("/duties");
  return response.data;
};

const getBuyerByCpf = async (cpf: string) => {
  const response = await api.get(`/buyers/signIn?cpf=${cpf}`);
  return response.data;
};

const getBuyer = async (id: string) => {
  const response = await api.get(`/buyers/${id}`);
  return response.data.data;
};

const deleteProduct = async (id: string) => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
}

const updateCart = async (buyer: IBuyer) => {
  const response = await api.patch(`/buyers/${buyer._id}`, buyer);
  return response.data.data;
};

const updateDuty = async (duty: IDuties) => {
  const response = await api.patch(`/duties/${duty._id}`, duty);
  return response.data.data;
};

const createProduct = async ( product: IProduct ) => {
  const response = await api.post(`/products`, product);
  return response.data.data;
}

const toKeycap = (n: number): string =>
  String(n).split("").map(d => `${d}️⃣`).join("");

const sendWhatsapp = async (buyer: IBuyer) => {
  const items = buyer?.cart?.items;
  let msg = "";

  if (items && items.length > 0) {
    items.forEach((item, index) => {
      msg = `${msg}${toKeycap(index + 1)}%20%20${
        item.product.name
      }%20%20${item?.product.badge}%20%20${
        item?.product.characteristic || ""
      }%20%20${item?.product.size || ""}%20%20-%20%20${item.product.unit !== "un" ? item.qt.toFixed(3) : item.qt}%20%20${
        item?.product.unit
      }%0a`;
    });
  }

  window.open(
    `https://api.whatsapp.com/send?phone=${buyer.marketPhone}&text=${msg}`,
    "_blank"
  );
};

const updateProduct = async (_id: string, product: IProduct) => {
  const response = await api.patch(`/products/${_id}`, product);
  return response.data.data;
};

export {
  getProducts,
  getBuyer,
  updateCart,
  getDuties,
  updateDuty,
  sendWhatsapp,
  deleteProduct,
  createProduct,
  createBuyer,
  getBuyerByCpf,
  updateProduct
};
