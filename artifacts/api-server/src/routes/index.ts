import { Router, type IRouter } from "express";
import healthRouter from "./health";
import uploadRouter from "./upload";
import estimateRouter from "./estimate";
import ndaRouter from "./nda";
import dealRoomsRouter from "./dealRoomsApi";

const router: IRouter = Router();

router.use(healthRouter);
router.use(uploadRouter);
router.use(estimateRouter);
router.use(ndaRouter);
router.use(dealRoomsRouter);

export default router;
