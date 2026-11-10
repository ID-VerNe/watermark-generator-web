/** Sanitize a filename component: replace path-hostile characters with `_`. */
export function sanitizeFilenameComponent(value: string): string {
  return value ? value.replace(/[\\/:*?"<>| \t]/g, "_") : "";
}