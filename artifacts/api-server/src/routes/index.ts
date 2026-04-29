import { Router, type IRouter } from "express";
import healthRouter from "./health";
import uploadRouter from "./upload";
import estimateRouter from "./estimate";
import ndaRouter from "./nda";
import dealRoomsRouter from "./dealRoomsApi";
import leadsRouter from "./leads";
import fxRouter from "./fx";
import authRouter from "./auth";
import platformNdaRouter from "./platformNda";
import dealLegalRouter from "./dealLegal";

const router: IRouter = Router();

router.use(healthRouter);
router.use(uploadRouter);
router.use(estimateRouter);
router.use(ndaRouter);
router.use(dealRoomsRouter);
router.use(leadsRouter);
router.use(fxRouter);
router.use(authRouter);
router.use(platformNdaRouter);
router.use(dealLegalRouter);

export default router;
