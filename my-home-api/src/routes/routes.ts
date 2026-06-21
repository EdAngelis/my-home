import { Router } from "express";
import productsRoutes from "./products.routes";
import buyersRoutes from "./buyers.routes";
import cartRoutes from "./cart.routes";
import dutyRoutes from "./duties.routes";

const router = Router();

router.use("/products", productsRoutes);
router.use("/buyers", buyersRoutes);
router.use("/cart", cartRoutes);
router.use("/duties", dutyRoutes);

export default router;
