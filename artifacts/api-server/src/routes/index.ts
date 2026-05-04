import { Router, type IRouter } from "express";
import healthRouter from "./health";
import uploadRouter from "./upload";
import estimateRouter from "./estimate";
import dealRoomsRouter from "./dealRoomsApi";
import leadsRouter from "./leads";
import fxRouter from "./fx";
import authRouter from "./auth";
import platformNdaRouter from "./platformNda";
import dealLegalRouter from "./dealLegal";
import dealCommissionRouter from "./dealCommission";
import userAdminRouter from "./userAdmin";
import yachtModerationRouter from "./yachtModeration";

const router: IRouter = Router();

router.use(healthRouter);
router.use(uploadRouter);
router.use(estimateRouter);
router.use(dealRoomsRouter);
router.use("/leads", leadsRouter);
router.use(fxRouter);
router.use(authRouter);
router.use(platformNdaRouter);
router.use(dealLegalRouter);
router.use(dealCommissionRouter);
router.use(userAdminRouter);
router.use(yachtModerationRouter);

export default router;
