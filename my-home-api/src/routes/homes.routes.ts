import { Router } from "express";
import {
  getHomes,
  getHome,
  postCreateHome,
  postJoinHome,
  postLeaveHome,
  postRemoveUser,
  postSetDefaultHome,
  updateHome,
  updateHomes,
  deleteHome,
  deleteHomes,
} from "../controller/homes.controller";

const router = Router();

router.get("/", getHomes);
router.post("/", postCreateHome);
router.post("/join", postJoinHome);
router.post("/leave", postLeaveHome);
router.post("/set-default", postSetDefaultHome);
router.post("/:homeId/remove-user", postRemoveUser);
router.get("/:id", getHome);
router.patch("/:id", updateHome);
router.patch("/", updateHomes);
router.delete("/:id", deleteHome);
router.delete("/", deleteHomes);

export default router;
