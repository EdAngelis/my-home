import express from "express";
import {
  getCategories,
  createCategory,
  getCategory,
  updateCategory,
  updateCategories,
  deleteCategory,
  deleteCategories,
} from "../controller/categories.controller";

const router = express.Router();

router.get("/", getCategories);
router.post("/create", createCategory);
router.get("/:id", getCategory);
router.patch("/:id", updateCategory);
router.patch("/", updateCategories);
router.delete("/:id", deleteCategory);
router.delete("/", deleteCategories);

export default router;
