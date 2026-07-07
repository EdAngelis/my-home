import api from "./service/api";
import IBuyer from "./models/buyer.model";
import IDuties from "./models/duties.model";
import IProduct from "./models/products.model";
import ICategory from "./models/category.model";
import IMaker from "./models/maker.model";
import IHome from "./models/home.model";

const createBuyer = async (buyer: IBuyer) => {

  const response = await api.post("/buyers", buyer);
  return response;
}

const getProducts = async (userId: string, homeId: string) => {
  const response = await api.get(
    `/products?createdByUserId=${userId}&home=${homeId}`
  );
  return response.data.data;
};

const getDuties = async (userId: string, homeId: string) => {
  const response = await api.get(
    `/duties?createdByUserId=${userId}&home=${homeId}`
  );
  return response.data;
};

const createDuty = async (duty: IDuties) => {
  const response = await api.post("/duties/create", duty);
  return response.data.data;
};

const deleteDuty = async (id: string, homeId: string) => {
  const response = await api.delete(`/duties/${id}?home=${homeId}`);
  return response.data;
};

const getCategories = async (userId: string, homeId: string) => {
  const response = await api.get(
    `/categories?createdByUserId=${userId}&home=${homeId}`
  );
  return response.data.data;
};

const createCategory = async (category: ICategory) => {
  const response = await api.post("/categories/create", category);
  return response.data.data;
};

const updateCategory = async (category: ICategory, homeId: string) => {
  const response = await api.patch(
    `/categories/${category._id}?createdByUserId=${category.createdByUserId}&home=${homeId}`,
    category
  );
  return response.data.data;
};

const deleteCategory = async (id: string, userId: string, homeId: string) => {
  const response = await api.delete(
    `/categories/${id}?createdByUserId=${userId}&home=${homeId}`
  );
  return response.data;
};

const getMakers = async (userId: string, homeId: string) => {
  const response = await api.get(
    `/makers?createdByUserId=${userId}&home=${homeId}`
  );
  return response.data.data;
};

const createMaker = async (maker: IMaker) => {
  const response = await api.post("/makers/create", maker);
  return response.data.data;
};

const updateMaker = async (maker: IMaker, homeId: string) => {
  const response = await api.patch(
    `/makers/${maker._id}?createdByUserId=${maker.createdByUserId}&home=${homeId}`,
    maker
  );
  return response.data.data;
};

const deleteMaker = async (id: string, userId: string, homeId: string) => {
  const response = await api.delete(
    `/makers/${id}?createdByUserId=${userId}&home=${homeId}`
  );
  return response.data;
};

const getBuyerByCpf = async (cpf: string) => {
  const response = await api.get(`/buyers/signIn?cpf=${cpf}`);
  return response.data;
};

const getBuyer = async (id: string, homeId?: string) => {
  const response = await api.get(
    `/buyers/${id}${homeId ? `?home=${homeId}` : ""}`
  );
  return response.data.data;
};

const deleteProduct = async (id: string, homeId: string) => {
  const response = await api.delete(`/products/${id}?home=${homeId}`);
  return response.data;
}

const updateCart = async (buyer: IBuyer, homeId: string) => {
  const response = await api.patch(`/buyers/${buyer._id}?home=${homeId}`, buyer);
  return response.data.data;
};

const updateDuty = async (duty: IDuties, homeId: string) => {
  const response = await api.patch(`/duties/${duty._id}?home=${homeId}`, duty);
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

const updateProduct = async (
  _id: string,
  homeId: string,
  product: IProduct
) => {
  const response = await api.patch(`/products/${_id}?home=${homeId}`, product);
  return response.data.data;
};

const listHomes = async (userId: string): Promise<IHome[]> => {
  const response = await api.get(`/homes?userId=${userId}`);
  return response.data.data;
};

const createHome = async (name: string, userId: string): Promise<IHome> => {
  const response = await api.post("/homes", { name, userId });
  return response.data.data;
};

const joinHome = async (code: string, userId: string): Promise<IHome> => {
  const response = await api.post("/homes/join", { code, userId });
  return response.data.data;
};

const leaveHome = async (userId: string): Promise<IBuyer> => {
  const response = await api.post("/homes/leave", { userId });
  return response.data.data;
};

const removeHomeFromUser = async (
  homeId: string,
  userId: string
): Promise<IHome> => {
  const response = await api.post(`/homes/${homeId}/remove-user`, { userId });
  return response.data.data;
};

const setDefaultHome = async (
  userId: string,
  homeId: string
): Promise<IBuyer> => {
  const response = await api.post("/homes/set-default", { userId, homeId });
  return response.data.data;
};

export {
  getProducts,
  getBuyer,
  updateCart,
  getDuties,
  createDuty,
  deleteDuty,
  updateDuty,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getMakers,
  createMaker,
  updateMaker,
  deleteMaker,
  sendWhatsapp,
  deleteProduct,
  createProduct,
  createBuyer,
  getBuyerByCpf,
  updateProduct,
  listHomes,
  createHome,
  joinHome,
  leaveHome,
  removeHomeFromUser,
  setDefaultHome
};
