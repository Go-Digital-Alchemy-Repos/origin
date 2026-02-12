import { Router } from "express";
import { pool } from "../../db";

export function healthRoutes(): Router {
  const router = Router();

  router.get("/", async (_req, res) => {
    try {
      await pool.query("SELECT 1");
      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        database: "connected",
      });
    } catch {
      res.status(503).json({
        status: "degraded",
        timestamp: new Date().toISOString(),
        database: "disconnected",
      });
    }
  });

  return router;
}
