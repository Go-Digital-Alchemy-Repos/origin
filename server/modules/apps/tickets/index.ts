import { Router } from "express";
import { ticketsRoutes } from "./tickets.routes";

export function createTicketsModule(): Router {
  const router = Router();
  router.use("/apps/tickets", ticketsRoutes());
  return router;
}
