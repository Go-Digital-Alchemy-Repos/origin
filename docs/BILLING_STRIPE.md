# Billing & Stripe Integration

## Overview

ORIGIN uses Stripe for subscription billing with a hybrid pricing model: a base plan fee plus per-site quantity pricing. Webhooks are the source of truth for subscription state.

## Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│  Frontend UI    │────▶│  API Routes   │────▶│   Stripe    │
│  /app/billing   │     │  /api/billing │     │   Checkout  │
└─────────────────┘     └──────────────┘     └─────────────┘
                              ▲
                              │
┌─────────────────┐     ┌──────────────┐
│  Stripe Events  │────▶│  Webhook     │
│  (source of     │     │  /api/       │
│   truth)        │     │  webhooks/   │
└─────────────────┘     │  stripe      │
                        └──────────────┘
```

## Plans

| Plan       | Base Price | Per-Site Add-on | Features |
|-----------|-----------|----------------|----------|
| Starter   | $29/mo    | —              | Page builder, media, basic SEO |
| Pro       | $79/mo    | $19/mo/site    | + Analytics, forms, blog |
| Enterprise| $199/mo   | $9/mo/site     | + API gateway, CRM, notifications, scheduling |

## Stripe Products & Prices

You need to create the following in your Stripe Dashboard:

### Products
1. **ORIGIN Starter** — Base plan
2. **ORIGIN Pro** — Base plan
3. **ORIGIN Enterprise** — Base plan
4. **Per-Site Add-on (Pro)** — Metered per-site
5. **Per-Site Add-on (Enterprise)** — Metered per-site

### Price IDs (Environment Variables)

```
STRIPE_PRICE_STARTER_BASE=price_xxx       # Starter monthly recurring
STRIPE_PRICE_PRO_BASE=price_xxx           # Pro monthly recurring
STRIPE_PRICE_PRO_SITE=price_xxx           # Pro per-site recurring
STRIPE_PRICE_ENTERPRISE_BASE=price_xxx    # Enterprise monthly recurring
STRIPE_PRICE_ENTERPRISE_SITE=price_xxx    # Enterprise per-site recurring
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `STRIPE_SECRET_KEY` | Yes | Stripe secret API key |
| `STRIPE_WEBHOOK_SECRET` | Yes | Webhook signing secret (whsec_xxx) |
| `STRIPE_PRICE_STARTER_BASE` | Yes | Price ID for Starter base plan |
| `STRIPE_PRICE_PRO_BASE` | Yes | Price ID for Pro base plan |
| `STRIPE_PRICE_PRO_SITE` | No | Price ID for Pro per-site add-on |
| `STRIPE_PRICE_ENTERPRISE_BASE` | Yes | Price ID for Enterprise base plan |
| `STRIPE_PRICE_ENTERPRISE_SITE` | No | Price ID for Enterprise per-site add-on |

## API Endpoints

### GET /api/billing/status
Returns billing status for the active workspace.

**Auth:** Required + workspace context

**Response:**
```json
{
  "configured": true,
  "subscription": {
    "plan": "pro",
    "status": "active",
    "siteQuantity": 3,
    "currentPeriodEnd": "2026-03-12T00:00:00.000Z",
    "cancelAtPeriodEnd": false
  },
  "entitlement": {
    "features": ["page_builder", "media_library", "seo_toolkit", "analytics", "form_builder", "blog_engine"],
    "limits": { "sites": 5, "pages_per_site": 100, "storage_gb": 10 }
  },
  "hasStripeCustomer": true
}
```

### POST /api/billing/checkout
Creates a Stripe Checkout session for plan purchase.

**Auth:** Required + workspace context

**Body:**
```json
{
  "plan": "pro",
  "siteQuantity": 3
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

### POST /api/billing/portal
Creates a Stripe Customer Portal session for self-serve subscription management.

**Auth:** Required + workspace context

**Response:**
```json
{
  "url": "https://billing.stripe.com/..."
}
```

### POST /api/webhooks/stripe
Stripe webhook endpoint for subscription lifecycle events.

**Auth:** Stripe signature verification (no user auth)

## Webhook Events Handled

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Creates/updates subscription + entitlements |
| `customer.subscription.updated` | Syncs status, period, quantity |
| `customer.subscription.deleted` | Marks canceled, downgrades to starter entitlements |
| `invoice.payment_failed` | Marks subscription as past_due |

## Database Tables

### stripe_customers
Links workspaces to Stripe customer IDs.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| workspace_id | varchar (FK, unique) | Links to workspaces |
| stripe_customer_id | text (unique) | Stripe customer ID |
| created_at | timestamp | Creation time |

### subscriptions
Tracks subscription state (webhook-driven).

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| workspace_id | varchar (FK, unique) | Links to workspaces |
| stripe_subscription_id | text (unique) | Stripe subscription ID |
| status | text | active, past_due, canceled, etc. |
| plan | text | starter, pro, enterprise |
| site_quantity | integer | Number of site add-ons |
| current_period_start | timestamp | Billing period start |
| current_period_end | timestamp | Billing period end |
| cancel_at_period_end | boolean | Whether canceling at period end |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update |

### entitlements
Feature flags and limits derived from subscription plan.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| workspace_id | varchar (FK, unique) | Links to workspaces |
| features | jsonb | Array of feature slugs |
| limits | jsonb | Object with numeric limits |
| updated_at | timestamp | Last update |

## Flow: New Subscription

1. User navigates to /app/billing
2. Clicks "Choose Plan" on desired plan card
3. Frontend POSTs to /api/billing/checkout with plan + siteQuantity
4. Backend creates Stripe Customer (if needed) and Checkout Session
5. User is redirected to Stripe Checkout
6. After payment, Stripe fires `checkout.session.completed` webhook
7. Webhook handler creates subscription + entitlements records
8. User returns to /app/settings?billing=success

## Flow: Manage Subscription

1. User clicks "Manage Subscription" on billing page
2. Frontend POSTs to /api/billing/portal
3. Backend creates Stripe Customer Portal session
4. User is redirected to Stripe portal (change plan, update payment, cancel)
5. Changes fire webhook events that update local DB

## Testing

Use Stripe test mode with test API keys. Use the Stripe CLI to forward webhooks locally:

```bash
stripe listen --forward-to localhost:5000/api/webhooks/stripe
```

Test card numbers:
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002
- 3D Secure: 4000 0025 0000 3155
