import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { existsSync } from "fs";
import path from "path";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Serve built frontend in production (e.g. Render deployment)
const frontendDist = path.resolve(process.cwd(), "artifacts/trustbit/dist/public");
if (existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get("*", (_req: Request, res: Response): void => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

export default app;
