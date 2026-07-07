import { Router } from "express";
import {
  getHomes,
  getUserHomes,
  getHome,
  postCreateHome,
  postJoinHome,
  postLeaveHome,
  deleteHomeUser,
  patchDefaultHome,
  updateHome,
  updateHomes,
  deleteHome,
  deleteHomes,
} from "../controller/homes.controller";

const router = Router();

router.get("/", getHomes);
router.get("/user/:userId", getUserHomes);
router.post("/create", postCreateHome);
router.post("/join", postJoinHome);
router.post("/leave", postLeaveHome);
router.patch("/default", patchDefaultHome);
router.get("/:id", getHome);
router.patch("/:id", updateHome);
router.patch("/", updateHomes);
router.delete("/:id/users/:userId", deleteHomeUser);
router.delete("/:id", deleteHome);
router.delete("/", deleteHomes);

export default router;
