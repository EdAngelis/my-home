import { Router } from "express";
import {
  getBuyers,
  createBuyers,
  signUp,
  getBuyer,
  updateBuyer,
  updateBuyers,
  deleteBuyer,
  deleteBuyers,
  signIn
} from "../controller/buyers.controller";

const router = Router();

router.get("/signIn", signIn)
router.get("/create-many", createBuyers);
router.post("/", signUp);
router.get("/:id", getBuyer);
router.patch("/:id", updateBuyer);
router.patch("/", updateBuyers);
router.delete("/:id", deleteBuyer);
router.delete("/", deleteBuyers);

export default router;
