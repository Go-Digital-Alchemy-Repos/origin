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

if (!key) {
  console.error(`Usage: npx tsx scripts/seed-marketplace-item.ts --key <key>`);
  console.error(`Example: npx tsx scripts/seed-marketplace-item.ts --key crm`);
  process.exit(1);
}

const manifestPath = path.join("docs", "apps", `${key}.manifest.json`);

if (!fs.existsSync(manifestPath)) {
  console.error(`Error: Manifest not found at ${manifestPath}`);
  console.error(`Run the app generator first: npx tsx scripts/generate-origin-app.ts --key ${key} --name "<Name>" --entitlement apps.${key}`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

console.log(`\nMarketplace Item Manifest for "${manifest.name}":`);
console.log(JSON.stringify(manifest, null, 2));
console.log(`\nTo insert this into the marketplace, add a DB seed in your migration or use:`);
console.log(`  INSERT INTO marketplace_items (name, slug, description, category, billing_type, status, ...)`);
console.log(`  VALUES ('${manifest.name}', '${manifest.key}', '${manifest.description}', '${manifest.category}', '${manifest.billingType}', 'DRAFT');`);
console.log(`\nThis script intentionally does NOT write to the database automatically.`);
console.log(`Review the manifest and manually insert or use the Studio Marketplace UI.`);
