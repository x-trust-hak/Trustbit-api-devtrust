import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import healthRouter from "./health";
import endpointsRouter from "./endpoints";
import proxyRouter from "./proxy";
import adminRouter from "./admin";
import visitorsRouter from "./visitors";
import telegramRouter from "./telegram";
import authRouter from "./auth";
import paymentRouter from "./payment";
import { metrics } from "../lib/metrics";
import { requireApiKey } from "../middleware/apiAuth";

const router: IRouter = Router();

router.use((req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    const cl = res.getHeader("content-length");
    const bytes = typeof cl === "string" ? parseInt(cl, 10) || 0 : 0;
    metrics.record(req.path, req.method, res.statusCode, ms, bytes);
  });
  next();
});

router.use(authRouter);
router.use(paymentRouter);
router.use(adminRouter);
router.use(healthRouter);
router.use(endpointsRouter);
router.use(visitorsRouter);
router.use(telegramRouter);
router.use(requireApiKey, proxyRouter);

export default router;
