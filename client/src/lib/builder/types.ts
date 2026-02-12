export const BUILDER_SCHEMA_VERSION = 1;

export interface BuilderContent {
  schemaVersion: number;
  data: PuckData;
}

export interface PuckData {
  content: PuckContentItem[];
  root: Record<string, unknown>;
  zones?: Record<string, PuckContentItem[]>;
}

export interface PuckContentItem {
  type: string;
  props: Record<string, unknown> & { id: string };
}

export function createEmptyBuilderContent(): BuilderContent {
  return {
    schemaVersion: BUILDER_SCHEMA_VERSION,
    data: {
      content: [],
      root: {},
    },
  };
}

export function isBuilderContent(val: unknown): val is BuilderContent {
  if (!val || typeof val !== "object") return false;
  const obj = val as Record<string, unknown>;
  return typeof obj.schemaVersion === "number" && obj.data !== undefined;
}

export function validateBuilderContent(val: unknown): { valid: boolean; content: BuilderContent | null; error?: string } {
  if (!val || typeof val !== "object") {
    return { valid: false, content: null, error: "Content is not an object" };
  }

  const obj = val as Record<string, unknown>;

  if (!isBuilderContent(obj)) {
    return { valid: false, content: null, error: "Missing schemaVersion or data" };
  }

  if (obj.schemaVersion > BUILDER_SCHEMA_VERSION) {
    return { valid: false, content: null, error: `Schema version ${obj.schemaVersion} is newer than supported version ${BUILDER_SCHEMA_VERSION}` };
  }

  const data = obj.data as Record<string, unknown>;
  if (!data || typeof data !== "object") {
    return { valid: false, content: null, error: "data must be an object" };
  }

  if (!Array.isArray(data.content)) {
    return { valid: false, content: null, error: "data.content must be an array" };
  }

  for (let i = 0; i < data.content.length; i++) {
    const item = data.content[i];
    if (!item || typeof item !== "object" || typeof item.type !== "string" || !item.props || typeof item.props.id !== "string") {
      return { valid: false, content: null, error: `Invalid content item at index ${i}: must have type (string) and props.id (string)` };
    }
  }

  if (data.root !== undefined && (typeof data.root !== "object" || data.root === null)) {
    return { valid: false, content: null, error: "data.root must be an object if present" };
  }

  return { valid: true, content: obj };
}
