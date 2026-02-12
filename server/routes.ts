import type { Express } from "express";
import { type Server } from "http";
import { registerAllModules } from "./modules/registry";
import { AppError } from "./modules/shared/errors";
import { ZodError } from "zod";

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
    if (err instanceof ZodError) {
      return res.status(400).json({
        error: {
          message: "Request validation failed",
          code: "VALIDATION_ERROR",
          details: err.errors,
        },
      });
    }
    next(err);
  });

  return httpServer;
}
