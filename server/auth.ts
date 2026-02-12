import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "@shared/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
    schema: {
      users: schema.users,
      sessions: schema.sessions,
      accounts: schema.accounts,
      verifications: schema.verifications,
    },
  }),
  secret: process.env.SESSION_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || getBaseUrl(),
  basePath: "/api/auth",
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: false,
    },
    additionalFields: {
      activeWorkspaceId: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "CLIENT_VIEWER",
        input: false,
      },
    },
  },
  advanced: {
    cookiePrefix: "origin",
    useSecureCookies: process.env.NODE_ENV === "production",
  },
});

function getBaseUrl(): string {
  if (process.env.REPLIT_DOMAINS) {
    const domain = process.env.REPLIT_DOMAINS.split(",")[0];
    return `https://${domain}`;
  }
  return `http://localhost:${process.env.PORT || 5000}`;
}

export type AuthInstance = typeof auth;
