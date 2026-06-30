import express from "express";
import {
  getMakers,
  createMaker,
  getMaker,
  updateMaker,
  updateMakers,
  deleteMaker,
  deleteMakers,
} from "../controller/makers.controller";

const router = express.Router();

router.get("/", getMakers);
router.post("/create", createMaker);
router.get("/:id", getMaker);
router.patch("/:id", updateMaker);
router.patch("/", updateMakers);
router.delete("/:id", deleteMaker);
router.delete("/", deleteMakers);

export default router;
