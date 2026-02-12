#!/usr/bin/env tsx
import * as fs from "fs";
import * as path from "path";

const args = process.argv.slice(2);
function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  return args[idx + 1];
}

const key = getArg("key");
const name = getArg("name");
const entitlement = getArg("entitlement");

if (!key || !name || !entitlement) {
  console.error(`Usage: npx tsx scripts/generate-origin-app.ts --key <key> --name "<Name>" --entitlement apps.<key>`);
  console.error(`Example: npx tsx scripts/generate-origin-app.ts --key crm --name "CRM" --entitlement apps.crm`);
  process.exit(1);
}

if (!key.match(/^[a-z][a-z0-9-]*$/)) {
  console.error(`Error: key must be lowercase alphanumeric with hyphens (got "${key}")`);
  process.exit(1);
}

if (!entitlement || entitlement.length === 0) {
  console.error(`Error: entitlement is required`);
  process.exit(1);
}

const PascalName = name.replace(/[^a-zA-Z0-9]/g, "");
const camelName = PascalName.charAt(0).toLowerCase() + PascalName.slice(1);

const createdFiles: string[] = [];

function writeFile(filePath: string, content: string) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  if (fs.existsSync(filePath)) {
    console.warn(`  SKIP (exists): ${filePath}`);
    return;
  }
  fs.writeFileSync(filePath, content, "utf-8");
  createdFiles.push(filePath);
  console.log(`  CREATE: ${filePath}`);
}

console.log(`\nGenerating ORIGIN App Add-on: "${name}" (key: ${key})\n`);

writeFile(`server/modules/apps/${key}/types.ts`, `export interface ${PascalName}HealthResponse {
  ok: boolean;
  app: { key: string; version: string };
}
`);

writeFile(`server/modules/apps/${key}/${key}.schemas.ts`, `import { z } from "zod";

export const ${camelName}HealthResponseSchema = z.object({
  ok: z.boolean(),
  app: z.object({
    key: z.string(),
    version: z.string(),
  }),
});
`);

writeFile(`server/modules/apps/${key}/${key}.repo.ts`, `// ${PascalName} repository — add database queries here
// import { db } from "../../../db";
// import { eq } from "drizzle-orm";

export const ${camelName}Repo = {
  // Add workspace-scoped data access methods here
};
`);

writeFile(`server/modules/apps/${key}/${key}.service.ts`, `import { ${camelName}Repo } from "./${key}.repo";

export const ${camelName}Service = {
  getHealth() {
    return { ok: true, app: { key: "${key}", version: "1.0.0" } };
  },
};
`);

writeFile(`server/modules/apps/${key}/${key}.routes.ts`, `import { Router } from "express";
import { ${camelName}Service } from "./${key}.service";
import {
  requireAuth,
  requireWorkspaceContext,
  requireEntitlement,
  getWorkspaceId,
} from "../../shared/auth-middleware";

export function ${camelName}Routes(): Router {
  const router = Router();

  const gate = [requireAuth(), requireWorkspaceContext(), requireEntitlement("${entitlement}")];

  router.get("/health", ...gate, async (req, res, next) => {
    try {
      const health = ${camelName}Service.getHealth();
      res.json(health);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
`);

writeFile(`server/modules/apps/${key}/index.ts`, `import { Router } from "express";
import { ${camelName}Routes } from "./${key}.routes";

export function create${PascalName}Module(): Router {
  const router = Router();
  router.use("/${key}", ${camelName}Routes());
  return router;
}

export { ${camelName}Service } from "./${key}.service";
`);

writeFile(`client/src/pages/apps/${key}/${PascalName}Home.tsx`, `import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Box, ArrowRight } from "lucide-react";

export default function ${PascalName}Home() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <Box className="h-7 w-7 text-primary" />
          </div>
          <CardTitle data-testid="text-app-title">${name}</CardTitle>
          <CardDescription data-testid="text-app-description">
            ${name} is installed but not configured yet. Set up your workspace to start using this app.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button data-testid="button-app-setup">
            Get started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
`);

writeFile(`client/src/pages/apps/${key}/routes.tsx`, `import ${PascalName}Home from "./${PascalName}Home";

export const ${camelName}AppRoutes = [
  { path: "/app/apps/${key}", component: ${PascalName}Home },
] as const;
`);

writeFile(`shared/apps/${key}/types.ts`, `export interface ${PascalName}Config {
  key: "${key}";
  enabled: boolean;
}
`);

writeFile(`shared/apps/${key}/schemas.ts`, `import { z } from "zod";

export const ${camelName}ConfigSchema = z.object({
  key: z.literal("${key}"),
  enabled: z.boolean(),
});
`);

writeFile(`docs/apps/${key}_DEV.md`, `# ${name} — Developer Documentation

## Overview
${name} is an ORIGIN App Add-on providing [describe purpose here].

## API Endpoints

### Health Check
\`\`\`
GET /api/apps/${key}/health
\`\`\`
Requires: auth + workspace context + \`${entitlement}\` entitlement.

Returns:
\`\`\`json
{ "ok": true, "app": { "key": "${key}", "version": "1.0.0" } }
\`\`\`

## Architecture
- Server module: \`server/modules/apps/${key}/\`
- Frontend: \`client/src/pages/apps/${key}/\`
- Shared types: \`shared/apps/${key}/\`

## Safety Rules
- All routes are gated by \`requireAuth()\`, \`requireWorkspaceContext()\`, and \`requireEntitlement("${entitlement}")\`.
- Frontend queries must use WorkspaceGuard before any data fetching.
- Query retry is disabled for 401/403/409 responses.
`);

writeFile(`docs/apps/${key}_RESOURCE.md`, `# ${name} — Help & Resources

## Getting Started
1. Install ${name} from the ORIGIN Marketplace.
2. Ensure your workspace has the required entitlement (\`${entitlement}\`).
3. Navigate to **Apps > ${name}** in your sidebar.

## Features
- [List features here]

## FAQ
**Q: Why can't I see ${name} in my sidebar?**
A: Make sure ${name} is installed via the Marketplace and your workspace plan includes the required feature.
`);

const manifest = {
  key,
  name,
  description: `${name} app add-on for ORIGIN platform.`,
  version: "1.0.0",
  entitlementKey: entitlement,
  category: "apps",
  billingType: "subscription",
  tagline: `${name} — workspace-scoped app add-on.`,
  features: [],
  status: "draft",
};

writeFile(`docs/apps/${key}.manifest.json`, JSON.stringify(manifest, null, 2) + "\n");

console.log(`\n--- Summary ---`);
console.log(`App key:        ${key}`);
console.log(`App name:       ${name}`);
console.log(`Entitlement:    ${entitlement}`);
console.log(`Files created:  ${createdFiles.length}`);
createdFiles.forEach((f) => console.log(`  - ${f}`));
console.log(`\nNext steps:`);
console.log(`  1. Register the app in shared/originApps/registry.ts`);
console.log(`  2. Add the server module in server/modules/registry.ts`);
console.log(`  3. Seed the marketplace item: npx tsx scripts/seed-marketplace-item.ts --key ${key}`);
console.log(`  4. Build your app's features!`);
console.log(`\nThe generated app is INERT — it will not appear in navigation or routes until:`);
console.log(`  - App status is set to "published" in the registry`);
console.log(`  - Workspace has the "${entitlement}" entitlement enabled`);
