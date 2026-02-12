import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../../auth";
import { storage } from "../../storage";
import type { Role } from "@shared/schema";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        role: string;
        image?: string | null;
      };
      session?: {
        id: string;
        token: string;
        userId: string;
        activeWorkspaceId?: string | null;
      };
      workspace?: {
        id: string;
        name: string;
        slug: string;
        memberRole: string;
      };
    }
  }
}

export function requireAuth() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });

      if (!session) {
        return res.status(401).json({
          error: { message: "Authentication required", code: "UNAUTHORIZED" },
        });
      }

      req.user = {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: (session.user as any).role || "CLIENT_VIEWER",
        image: session.user.image,
      };

      req.session = {
        id: session.session.id,
        token: session.session.token,
        userId: session.session.userId,
        activeWorkspaceId: (session.session as any).activeWorkspaceId,
      };

      next();
    } catch {
      return res.status(401).json({
        error: { message: "Invalid session", code: "UNAUTHORIZED" },
      });
    }
  };
}

export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: { message: "Authentication required", code: "UNAUTHORIZED" },
      });
    }

    if (req.user.role === "SUPER_ADMIN") {
      return next();
    }

    if (!allowedRoles.includes(req.user.role as Role)) {
      return res.status(403).json({
        error: { message: "Insufficient permissions", code: "FORBIDDEN" },
      });
    }

    next();
  };
}

export function requireWorkspaceContext() {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: { message: "Authentication required", code: "UNAUTHORIZED" },
      });
    }

    if (req.user.role === "SUPER_ADMIN") {
      const workspaceId = req.headers["x-workspace-id"] as string || req.session?.activeWorkspaceId;
      if (workspaceId) {
        const ws = await storage.getWorkspace(workspaceId);
        if (ws) {
          req.workspace = { id: ws.id, name: ws.name, slug: ws.slug, memberRole: "SUPER_ADMIN" };
        }
      }
      return next();
    }

    const workspaceId = req.headers["x-workspace-id"] as string || req.session?.activeWorkspaceId;

    if (!workspaceId) {
      return res.status(400).json({
        error: { message: "Workspace context required. Set x-workspace-id header or select a workspace.", code: "WORKSPACE_REQUIRED" },
      });
    }

    const membership = await storage.getMembership(req.user.id, workspaceId);
    if (!membership) {
      return res.status(403).json({
        error: { message: "Not a member of this workspace", code: "WORKSPACE_FORBIDDEN" },
      });
    }

    const ws = await storage.getWorkspace(workspaceId);
    if (!ws) {
      return res.status(404).json({
        error: { message: "Workspace not found", code: "WORKSPACE_NOT_FOUND" },
      });
    }

    req.workspace = {
      id: ws.id,
      name: ws.name,
      slug: ws.slug,
      memberRole: membership.role,
    };

    next();
  };
}

export function requireWorkspaceRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.workspace) {
      return res.status(400).json({
        error: { message: "Workspace context required", code: "WORKSPACE_REQUIRED" },
      });
    }

    if (req.user?.role === "SUPER_ADMIN") {
      return next();
    }

    if (!allowedRoles.includes(req.workspace.memberRole as Role)) {
      return res.status(403).json({
        error: { message: "Insufficient workspace permissions", code: "WORKSPACE_FORBIDDEN" },
      });
    }

    next();
  };
}

export function scopeByWorkspace(workspaceId?: string) {
  if (!workspaceId) {
    throw new Error("Workspace ID required for scoped query");
  }
  return workspaceId;
}

export function scopeBySite(siteId?: string) {
  if (!siteId) {
    throw new Error("Site ID required for scoped query");
  }
  return siteId;
}
