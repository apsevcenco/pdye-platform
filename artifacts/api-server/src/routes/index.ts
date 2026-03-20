import { Router, type IRouter } from "express";
import healthRouter from "./health";
import uploadRouter from "./upload";
import estimateRouter from "./estimate";

const router: IRouter = Router();

router.use(healthRouter);
router.use(uploadRouter);
router.use(estimateRouter);

export default router;
