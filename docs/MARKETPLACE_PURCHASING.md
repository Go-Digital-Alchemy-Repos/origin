# Marketplace Purchasing System

**Created:** 2026-02-12

## Overview

The Marketplace Purchasing System extends the ORIGIN Marketplace with Stripe-backed monetization. Marketplace items can be configured as free, one-time purchase, or subscription-based. The system handles checkout sessions, webhook-driven purchase recording, entitlement gating, and workspace-scoped purchase tracking.

## Architecture

### Schema Extensions

**`marketplace_items` table additions:**

| Column | Type | Description |
|---|---|---|
| `billing_type` | `text` (enum) | `"free"`, `"subscription"`, or `"one_time"` |
| `entitlement_key` | `text` | Feature key granted upon purchase (e.g., `"analytics"`) |
| `entitlement_payload_json` | `jsonb` | Additional payload for entitlement logic |

**`workspace_purchases` table:**

| Column | Type | Description |
|---|---|---|
| `id` | `varchar` (UUID) | Primary key |
| `workspace_id` | `varchar` | FK to `workspaces` |
| `marketplace_item_id` | `varchar` | FK to `marketplace_items` |
| `stripe_subscription_item_id` | `text` | Stripe subscription item ID (for recurring) |
| `stripe_payment_intent_id` | `text` | Stripe payment intent ID (for one-time) |
| `created_at` | `timestamp` | Purchase timestamp |

### Billing Types

- **`free`**: No payment required. Item can be installed directly.
- **`one_time`**: Single Stripe Checkout session in `payment` mode. Purchase record created via webhook.
- **`subscription`**: Recurring Stripe Checkout session in `subscription` mode. Purchase linked to subscription item for cancellation handling.

## API Endpoints

### `POST /api/marketplace/checkout`

Creates a Stripe Checkout session for a paid marketplace item.

**Auth:** `requireAuth()`, `requireWorkspaceContext()`

**Body:**
```json
{ "itemId": "string" }
```

**Response:**
```json
{ "url": "https://checkout.stripe.com/..." }
```

**Error cases:**
- `400` if item is free or has no `priceId`
- `409` if item already purchased

### `GET /api/marketplace/purchases`

Returns all purchases for the current workspace.

**Auth:** `requireAuth()`, `requireWorkspaceContext()`

**Response:** `WorkspacePurchase[]`

## Webhook Handling

The billing webhook handler (`handleWebhookEvent`) was extended with marketplace-specific logic:

### `checkout.session.completed`

When `metadata.purchaseType === "marketplace"`:
1. Extracts `workspaceId` and `marketplaceItemId` from session metadata
2. For subscription mode: retrieves subscription item ID from Stripe
3. Calls `marketplaceService.recordPurchase()` which:
   - Creates a `workspace_purchases` record
   - Auto-installs the item (creates or enables `marketplace_installs` record)

### `customer.subscription.deleted`

When `metadata.purchaseType === "marketplace"`:
- Revokes the purchase by deleting the `workspace_purchases` record matching the subscription item ID

## Install Gating

The `marketplaceService.installItem()` method enforces purchase requirements:

1. If `billing_type` is `"free"` or `isFree` is true → install allowed
2. If `billing_type` is `"subscription"` or `"one_time"` → checks `workspace_purchases` for existing purchase record
3. If no purchase record exists → throws `ValidationError("Purchase required before installing this item")`

## Entitlement Middleware

### `requireEntitlement(featureKey: string)`

Express middleware that gates route access based on workspace entitlements.

```typescript
router.get("/analytics", requireAuth(), requireWorkspaceContext(), requireEntitlement("analytics"), handler);
```

**Logic:**
1. Super admins bypass all entitlement checks
2. Extracts workspace ID from request context
3. Queries `entitlements` table for workspace
4. Checks if `features` array includes the given `featureKey`
5. Returns `403` if feature is not included in the workspace's plan

## Frontend Flow

### Purchase Flow

1. User clicks "Purchase" on a paid marketplace item
2. Frontend calls `POST /api/marketplace/checkout` with `itemId`
3. User is redirected to Stripe Checkout
4. On success, Stripe redirects back to `/app/marketplace?purchased=<slug>`
5. Webhook fires `checkout.session.completed` → purchase record created, item auto-installed
6. Frontend shows success toast and refreshes install/purchase queries

### Visual Indicators

- **Free items:** "Install Free" button, "Free" badge
- **Paid items (not purchased):** "Purchase — $X.XX" or "Purchase — $X.XX/mo" button
- **Paid items (purchased, not installed):** "Install (Purchased)" button + blue shield icon
- **Installed items:** "Uninstall" button + green check icon

## Configuration

Each marketplace item requires the following for paid functionality:

1. `billing_type`: Set to `"subscription"` or `"one_time"`
2. `price_id`: Valid Stripe Price ID
3. `price`: Amount in cents (for display purposes)
4. `is_free`: Set to `false`

## Module File Structure

```
server/modules/marketplace/
├── marketplace.repo.ts      # DB queries including workspace_purchases
├── marketplace.service.ts   # Business logic with purchase gating
├── marketplace.routes.ts    # API endpoints including /checkout
└── index.ts                 # Module registration

server/modules/billing/
└── billing.service.ts        # createMarketplaceCheckoutSession + webhook handling

server/modules/shared/
└── auth-middleware.ts        # requireEntitlement middleware
```
