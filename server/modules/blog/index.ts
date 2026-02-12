import { Router } from "express";
import { blogRoutes } from "./blog.routes";

export function createBlogModule(): Router {
  const router = Router();
  router.use("/cms", blogRoutes());
  return router;
}

export { blogService } from "./blog.service";
