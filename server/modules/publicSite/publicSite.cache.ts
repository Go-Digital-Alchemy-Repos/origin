import type { Response } from "express";
import { log } from "../../index";

const DEFAULT_MAX_AGE = 60;
const STALE_WHILE_REVALIDATE = 300;

export function setCacheHeaders(res: Response, opts?: { maxAge?: number; isPrivate?: boolean }) {
  const maxAge = opts?.maxAge ?? DEFAULT_MAX_AGE;
  const visibility = opts?.isPrivate ? "private" : "public";
  res.set("Cache-Control", `${visibility}, max-age=${maxAge}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}`);
  res.set("Vary", "Accept-Encoding");
}

export function setNoCacheHeaders(res: Response) {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.set("Pragma", "no-cache");
}

const purgeCallbacks: Array<(siteId: string, pageSlug?: string) => void> = [];

export function onCachePurge(callback: (siteId: string, pageSlug?: string) => void) {
  purgeCallbacks.push(callback);
}

export function purgeCache(siteId: string, pageSlug?: string) {
  log(`Cache purge requested for site=${siteId}${pageSlug ? ` page=${pageSlug}` : " (all pages)"}`, "cache");
  for (const cb of purgeCallbacks) {
    try {
      cb(siteId, pageSlug);
    } catch (err) {
      log(`Cache purge callback error: ${err}`, "cache");
    }
  }
}
