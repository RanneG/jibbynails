export const OWNER_KEYS = new Set(["jibby-owner", "jibby"]);

export function isOwnerKey(value?: string | null) {
  return Boolean(value && OWNER_KEYS.has(value));
}
