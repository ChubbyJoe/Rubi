// Services return this for expected failures; only unexpected faults throw.
export type Result<T, E extends string> =
  { readonly ok: true; readonly data: T } | { readonly ok: false; readonly error: E };

export const ok = <T>(data: T) => ({ ok: true, data }) as const;
export const err = <E extends string>(error: E) => ({ ok: false, error }) as const;
