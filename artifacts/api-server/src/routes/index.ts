import { Router, type IRouter } from "express";
import healthRouter from "./health";
import endpointsRouter from "./endpoints";
import proxyRouter from "./proxy";

const router: IRouter = Router();

router.use(healthRouter);
router.use(endpointsRouter);
router.use(proxyRouter);

export default router;
