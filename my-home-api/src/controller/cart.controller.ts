import { Request, Response } from "express";
import { response } from "../types/response-body.type";
import { pushItem, pullItem } from "../repository/cart.repo";
import { findOne } from "../repository/buyers.repo";
import { findOne as findProduct } from "../repository/products.repo";
import { IBuyer, Items } from "../models/buyer.model";
import { WhatsMessageType } from "../types";

const addItem = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { homeId } = req.query;
  try {
    const data: Items[] = req.body;

    if (!homeId)
      return response(res, 400, { message: "homeId is required", data: null });

    for (const item of data) {
      const productId =
        typeof item.product === "string" ? item.product : item.product?._id;
      const product = await findProduct(productId as string, homeId as string);
      if (!product)
        return response(res, 400, {
          message: "Product does not belong to the given home",
          data: null,
        });
    }

    const result = await pushItem(id, homeId as string, data);
    if (!result)
      return response(res, 400, {
        message: "Failed to add item to cart",
        data: result,
      });

    return response(res, 200, { message: "Items added", data: result });
  } catch (error) {
    throw error;
    return response(res, 500, {
      message: "Internal server error",
      data: error,
    });
  }
};

const removeItem = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { productIds } = req.body;

    const data = await pullItem(id, productIds);
    if (!data)
      return response(res, 400, {
        message: "Failed to remove item to cart",
        data,
      });

    return response(res, 200, { message: "Items removed", data });
  } catch (error) {
    return response(res, 500, {
      message: "Internal server error",
      data: error,
    });
  }
};

const sendOrder = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const buyer = await findOne(id);
    if (!buyer)
      return response(res, 404, { message: "Buyer not found", data: null });

    const { cart } = buyer as IBuyer;

    let order: WhatsMessageType = {
      total: 0,
      items: [],
    };
    for (let item of cart!.items) {
      const row = `${item?.product.name} ${item?.product.badge} ${
        item?.product.characteristic || ""
      } ${item?.product.size || ""} - ${item.qt} ${item?.product.unit}`;

      order.items.push(row);
      console.log(row);

      order.total += item.qt * item?.product.price;
    }
    console.log(order.total);
    return response(res, 200, { message: "Order sended", data: order });
  } catch (error) {
    console.log(error);
    return response(res, 500, {
      message: "Internal server error",
      data: error,
    });
  }
};

export { addItem, removeItem, sendOrder };
