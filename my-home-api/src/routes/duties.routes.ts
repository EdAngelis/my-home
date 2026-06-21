import express from "express";
import {
  getDuties,
  createDuty,
  getDuty,
  updateDuty,
  updateDuties,
  deleteDuty,
  deleteDuties,
} from "../controller/duties.controller";

const router = express.Router();

router.get("/", getDuties);
router.post("/create", createDuty);
router.get("/:id", getDuty);
router.patch("/:id", updateDuty);
router.patch("/", updateDuties);
router.delete("/:id", deleteDuty);
router.delete("/", deleteDuties);

export default router;
