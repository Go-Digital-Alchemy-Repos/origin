export interface SemVer {
  major: number;
  minor: number;
  patch: number;
}

const SEMVER_REGEX = /^(\d+)\.(\d+)\.(\d+)$/;

export function parseSemVer(version: string): SemVer | null {
  const match = version.match(SEMVER_REGEX);
  if (!match) return null;
  return { major: parseInt(match[1], 10), minor: parseInt(match[2], 10), patch: parseInt(match[3], 10) };
}

export function isValidSemVer(version: string): boolean {
  return SEMVER_REGEX.test(version);
}

export function formatSemVer(v: SemVer): string {
  return `${v.major}.${v.minor}.${v.patch}`;
}

export function compareSemVer(a: string, b: string): number {
  const va = parseSemVer(a);
  const vb = parseSemVer(b);
  if (!va || !vb) return 0;
  if (va.major !== vb.major) return va.major - vb.major;
  if (va.minor !== vb.minor) return va.minor - vb.minor;
  return va.patch - vb.patch;
}

export function isVersionGte(version: string, minVersion: string): boolean {
  return compareSemVer(version, minVersion) >= 0;
}

export type BumpType = "major" | "minor" | "patch";

export function bumpVersion(current: string, type: BumpType): string {
  const v = parseSemVer(current);
  if (!v) return current;
  switch (type) {
    case "major":
      return formatSemVer({ major: v.major + 1, minor: 0, patch: 0 });
    case "minor":
      return formatSemVer({ major: v.major, minor: v.minor + 1, patch: 0 });
    case "patch":
      return formatSemVer({ major: v.major, minor: v.minor, patch: v.patch + 1 });
  }
}

export const PLATFORM_VERSION = "1.0.0";

export interface CompatibilityResult {
  compatible: boolean;
  reason?: string;
}

export function checkCompatibility(
  itemMinPlatformVersion: string | null,
  platformVersion: string = PLATFORM_VERSION,
): CompatibilityResult {
  if (!itemMinPlatformVersion) return { compatible: true };
  if (!isValidSemVer(itemMinPlatformVersion)) return { compatible: true };
  if (!isVersionGte(platformVersion, itemMinPlatformVersion)) {
    return {
      compatible: false,
      reason: `Requires platform v${itemMinPlatformVersion} or higher (current: v${platformVersion})`,
    };
  }
  return { compatible: true };
}
