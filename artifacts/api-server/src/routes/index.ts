import { Router, type IRouter } from "express";
import healthRouter from "./health";
import uploadRouter from "./upload";
import estimateRouter from "./estimate";
import ndaRouter from "./nda";
import dealRoomsRouter from "./dealRoomsApi";
import leadsRouter from "./leads";
import fxRouter from "./fx";

const router: IRouter = Router();

router.use(healthRouter);
router.use(uploadRouter);
router.use(estimateRouter);
router.use(ndaRouter);
router.use(dealRoomsRouter);
router.use(leadsRouter);
router.use(fxRouter);

export default router;
