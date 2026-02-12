import type { Express } from "express";
import { type Server } from "http";
import { registerAllModules } from "./modules/registry";
import { AppError } from "./modules/shared/errors";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const api = registerAllModules();
  app.use("/api", api);

  app.use("/api", (err: any, _req: any, res: any, next: any) => {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json(err.toJSON());
    }
    next(err);
  });

  return httpServer;
}
