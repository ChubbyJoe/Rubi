// Services return this for expected failures; only unexpected faults throw.
// `E` is a string code, or an object with a `code` when the caller needs
// details (for example which items changed price).
export type Result<T, E> =
  { readonly ok: true; readonly data: T } | { readonly ok: false; readonly error: E };

export const ok = <T>(data: T) => ({ ok: true, data }) as const;
export const err = <const E>(error: E) => ({ ok: false, error }) as const;
