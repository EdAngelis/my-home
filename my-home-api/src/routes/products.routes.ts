import express from "express";
import {
  getProducts,
  createProducts,
  createProduct,
  getProduct,
  updateProduct,
  updateProducts,
  deleteProduct,
  deleteProducts,
} from "../controller/products.controller";

const router = express.Router();

router.get("/", getProducts);
router.get("/create-many", createProducts);
router.post("/", createProduct);
router.get("/:id", getProduct);
router.patch("/:id", updateProduct);
router.patch("/", updateProducts);
router.delete("/:id", deleteProduct);
router.delete("/", deleteProducts);

export default router;
