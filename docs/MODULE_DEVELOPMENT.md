# Module Development Guide

## Overview

ORIGIN modules are self-contained feature packages that follow a consistent pattern for easy development and maintenance.

## Creating a Module

### Step 1: Schema

Add your data model to `shared/schema.ts`:

```ts
export const myEntities = pgTable("my_entities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  // ... other fields
});

export const insertMyEntitySchema = createInsertSchema(myEntities).omit({
  id: true,
});

export type InsertMyEntity = z.infer<typeof insertMyEntitySchema>;
export type MyEntity = typeof myEntities.$inferSelect;
```

### Step 2: Repository (`myModule.repo.ts`)

```ts
import { db } from "../../db";
import { myEntities } from "@shared/schema";
import { eq } from "drizzle-orm";

class MyModuleRepo {
  async findAll() { return db.select().from(myEntities); }
  async findById(id: string) { /* ... */ }
  async create(data: InsertMyEntity) { /* ... */ }
}

export const myModuleRepo = new MyModuleRepo();
```

### Step 3: Service (`myModule.service.ts`)

```ts
import { myModuleRepo } from "./myModule.repo";
import { NotFoundError } from "../shared/errors";

class MyModuleService {
  async getAll() { return myModuleRepo.findAll(); }
  async getById(id: string) {
    const entity = await myModuleRepo.findById(id);
    if (!entity) throw new NotFoundError("MyEntity");
    return entity;
  }
}

export const myModuleService = new MyModuleService();
```

### Step 4: Routes (`myModule.routes.ts`)

```ts
import { Router } from "express";
import { myModuleService } from "./myModule.service";
import { validateBody } from "../shared/validate";
import { insertMyEntitySchema } from "@shared/schema";

export function myModuleRoutes(): Router {
  const router = Router();
  router.get("/", async (_req, res, next) => { /* ... */ });
  router.post("/", validateBody(insertMyEntitySchema), async (req, res, next) => { /* ... */ });
  return router;
}
```

### Step 5: Module Entry (`index.ts`)

```ts
import { Router } from "express";
import { myModuleRoutes } from "./myModule.routes";

export function createMyModule(): Router {
  const router = Router();
  router.use("/my-entities", myModuleRoutes());
  return router;
}
```

### Step 6: Register in Registry

Add to `server/modules/registry.ts`:

```ts
import { createMyModule } from "./myModule";
// ...
api.use(createMyModule());
```

### Step 7: Push Schema

```bash
npm run db:push
```

## Best Practices

- Keep repos thin — only database operations
- Business logic belongs in the service layer
- Always validate input with Zod middleware
- Use `AppError` subclasses for typed errors
- Export singleton instances from service/repo files
