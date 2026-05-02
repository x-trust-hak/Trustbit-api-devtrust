import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import healthRouter from "./health";
import endpointsRouter from "./endpoints";
import proxyRouter from "./proxy";
import adminRouter from "./admin";
import { metrics } from "../lib/metrics";

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

router.use(adminRouter);
router.use(healthRouter);
router.use(endpointsRouter);
router.use(proxyRouter);

export default router;
