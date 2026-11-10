/** Persist a JSON value to localStorage, tolerating quota/availability errors. */
export function saveState<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(
      `Could not save state for key "${key}" to localStorage:`,
      error,
    );
  }
}

/** Load a JSON value from localStorage, falling back to the default. */
export function loadState<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? defaultValue : (JSON.parse(raw) as T);
  } catch (error) {
    console.warn(
      `Could not load state for key "${key}" from localStorage, using default:`,
      error,
    );
    return defaultValue;
  }
}