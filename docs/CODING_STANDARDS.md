# ORIGIN Coding Standards

## TypeScript

- Strict mode enabled
- All files use `.ts` or `.tsx` extensions
- Use explicit types over `any`
- Use Zod for runtime validation
- Export types from `shared/schema.ts`

## Server Patterns

### Module Structure

```
server/modules/<name>/
  index.ts         → createXModule(): Router
  <name>.routes.ts → route handlers
  <name>.service.ts → business logic (singleton export)
  <name>.repo.ts   → database queries (singleton export)
```

### Error Handling

Use `AppError`, `NotFoundError`, `ValidationError` from `server/modules/shared/errors.ts`:

```ts
throw new NotFoundError("User");
throw new ValidationError("Email is required", details);
```

### Request Validation

Use `validateBody()` and `validateQuery()` middleware from `server/modules/shared/validate.ts`:

```ts
router.post("/", validateBody(insertSchema), async (req, res, next) => {
  // req.body is validated and typed
});
```

## Frontend Patterns

- Use shadcn/ui components from `@/components/ui/`
- Use `@tanstack/react-query` for data fetching
- Use `wouter` for routing (`Link`, `useLocation`)
- Pages go in `client/src/pages/`
- Shared components in `client/src/components/`

## Naming Conventions

- Files: kebab-case (`my-component.tsx`)
- Components: PascalCase (`MyComponent`)
- Variables/functions: camelCase
- Constants: UPPER_SNAKE_CASE
- Database tables: snake_case
- API routes: kebab-case (`/api/doc-entries`)

## Environment Variables

- Use `process.env.DATABASE_URL` for database connection
- Validate required env vars at startup
- Never commit secrets to the repository
