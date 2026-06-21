import { Router } from "express";
import { addItem, removeItem, sendOrder } from "../controller/cart.controller";

const router = Router();

router.post("/add/:id", addItem);
router.post("/remove/:id", removeItem);
router.get("/send/:id", sendOrder);

export default router;
