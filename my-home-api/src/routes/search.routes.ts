import express from "express";
import { searchProducts } from "../controller/search.controller";

const router = express.Router();

router.get("/products", searchProducts);

export default router;
