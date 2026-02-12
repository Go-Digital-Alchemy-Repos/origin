import * as fs from "fs";
import * as path from "path";

const args = process.argv.slice(2);
const flags: Record<string, string> = {};
for (let i = 0; i < args.length; i += 2) {
  const key = args[i]?.replace(/^--/, "");
  const val = args[i + 1];
  if (key && val) flags[key] = val;
}

const key = flags.key;
const name = flags.name || key;
const entitlement = flags.entitlement || `apps.${key}`;
const version = flags.version || "0.1.0";
const billing = flags.billing || "free";

if (!key) {
  console.error("Usage: npx tsx scripts/gen-app.ts --key <key> --name <Name> [--entitlement apps.<key>] [--version 0.1.0] [--billing free]");
  console.error("Example: npx tsx scripts/gen-app.ts --key tickets --name Tickets --entitlement apps.tickets");
  process.exit(1);
}

if (!/^[a-z][a-z0-9-]*$/.test(key)) {
  console.error(`Error: key "${key}" must be lowercase alphanumeric with hyphens only.`);
  process.exit(1);
}

function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

const PascalName = toPascalCase(name);
const camelKey = toCamelCase(key);
const serverDir = path.join("server", "modules", "apps", key);
const clientPage = path.join("client", "src", "pages", `app-${key}.tsx`);
const docsDir = "docs";
const devDocPath = path.join(docsDir, `apps`, `${key}_DEV.md`);
const resourceDocPath = path.join(docsDir, `apps`, `${key}_RESOURCE.md`);

if (fs.existsSync(serverDir)) {
  console.error(`Error: Server module already exists at ${serverDir}`);
  process.exit(1);
}

if (fs.existsSync(clientPage)) {
  console.error(`Error: Client page already exists at ${clientPage}`);
  process.exit(1);
}

console.log(`\nGenerating ORIGIN App Add-on: "${name}" (key: ${key})\n`);

fs.mkdirSync(serverDir, { recursive: true });
fs.mkdirSync(path.join(docsDir, "apps"), { recursive: true });

const filesCreated: string[] = [];

function writeFile(filePath: string, content: string) {
  fs.writeFileSync(filePath, content, "utf-8");
  filesCreated.push(filePath);
}

writeFile(
  path.join(serverDir, `${key}.service.ts`),
  `import { getAppByKey } from "@shared/originApps";

const appDef = getAppByKey("${key}")!;

export const ${camelKey}Service = {
  getHealth(workspaceId: string) {
    return {
      app: appDef.key,
      version: appDef.version,
      status: "enabled",
      workspaceId,
    };
  },
};
`
);

writeFile(
  path.join(serverDir, `${key}.routes.ts`),
  `import { Router } from "express";
import { ${camelKey}Service } from "./${key}.service";
import { requireAuth, requireWorkspaceContext, requireEntitlement, getWorkspaceId } from "../../shared/auth-middleware";

export function ${camelKey}Routes(): Router {
  const router = Router();

  const gate = [requireAuth(), requireWorkspaceContext(), requireEntitlement("${entitlement}")];

  router.get("/health", ...gate, async (req, res, next) => {
    try {
      const workspaceId = getWorkspaceId(req)!;
      const health = ${camelKey}Service.getHealth(workspaceId);
      res.json(health);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
`
);

writeFile(
  path.join(serverDir, "index.ts"),
  `import { Router } from "express";
import { ${camelKey}Routes } from "./${key}.routes";

export function create${PascalName}Module(): Router {
  const router = Router();
  router.use("/apps/${key}", ${camelKey}Routes());
  return router;
}
`
);

writeFile(
  clientPage,
  `import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function App${PascalName}Page() {
  const { data: health, isLoading, error } = useQuery<{
    app: string;
    version: string;
    status: string;
    workspaceId: string;
  }>({
    queryKey: ["/api/apps/${key}/health"],
    retry: false,
  });

  const isEntitlementMissing = error && (error instanceof Error) && error.message.startsWith("403");

  if (isEntitlementMissing) {
    return (
      <div className="flex items-center justify-center p-12">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center py-10 text-center">
            <h2 className="mt-4 text-lg font-semibold" data-testid="text-${key}-not-enabled">
              ${name} App Not Enabled
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              The ${name} add-on is not enabled for this workspace. Install it from the Marketplace.
            </p>
            <Link href="/app/marketplace">
              <Button className="mt-6" data-testid="button-${key}-marketplace">
                Go to Marketplace
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-${key}-title">${name}</h1>
            {health && (
              <Badge variant="secondary" className="text-xs" data-testid="badge-${key}-version">
                v{health.version}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            ${name} add-on for ORIGIN.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <h2 className="mt-4 text-lg font-semibold" data-testid="text-${key}-placeholder">
              ${name} is installed but not configured yet
            </h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              This add-on is ready for development.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
`
);

writeFile(
  devDocPath,
  `# ${name} App — Developer Documentation

## Overview

The ${name} app is an ORIGIN add-on gated by the \`${entitlement}\` entitlement.

## Architecture

### Server Module
- Location: \`server/modules/apps/${key}/\`
- API Base: \`/api/apps/${key}\`
- Entitlement: \`${entitlement}\`

### Client UI
- Location: \`client/src/pages/app-${key}.tsx\`
- Route: \`/app/apps/${key}\`

### Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | \`/api/apps/${key}/health\` | Health check and version info |

## Gating

All routes use \`requireEntitlement("${entitlement}")\`. If the entitlement is missing, the API returns 403 and the UI shows a "not enabled" state with a link to the Marketplace.

## Adding Features

1. Add new routes in \`${key}.routes.ts\`
2. Add business logic in \`${key}.service.ts\`
3. Add DB schema in \`shared/schema.ts\` if needed
4. Update the UI page in \`app-${key}.tsx\`
`
);

writeFile(
  resourceDocPath,
  `# ${name} — Help & Resources

## What is ${name}?

${name} is an add-on app for ORIGIN that extends your workspace with additional capabilities.

## How to Enable

1. Go to the **Marketplace** in your workspace sidebar
2. Find **${name}** under the Apps category
3. Click **Install** to enable it

## Getting Started

Once enabled, you will see **${name}** appear in the Apps section of your sidebar. Click on it to access the ${name} dashboard.

## Need Help?

Contact your platform administrator or visit the Help & Resources section for more information.
`
);

console.log("Files created:");
filesCreated.forEach((f) => console.log(`  ${f}`));

console.log(`
MANUAL WIRING REQUIRED:
1. Add app definition to shared/originApps/registry.ts
2. Add create${PascalName}Module() import in server/modules/apps/index.ts
3. Add route in client/src/App.tsx
4. Add nav item in client/src/components/app-sidebar.tsx
5. Seed marketplace item in server/seed.ts (optional)

App Details:
  Key:          ${key}
  Name:         ${name}
  Version:      ${version}
  Entitlement:  ${entitlement}
  API Base:     /api/apps/${key}
  UI Route:     /app/apps/${key}
  Billing:      ${billing}
`);
