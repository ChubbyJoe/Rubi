// Drizzle wraps driver errors (DrizzleQueryError), so the Postgres fields
// may sit on the error itself or on its `cause`.
export type PgError = {
  readonly code: string;
  readonly constraint?: string;
  readonly detail?: string;
  readonly message: string;
};

export function asPgError(error: unknown): PgError | undefined {
  const candidates = [error, (error as { cause?: unknown } | null)?.cause];
  return candidates.find(
    (value): value is PgError =>
      typeof value === "object" &&
      value !== null &&
      typeof (value as { code?: unknown }).code === "string",
  );
}

export const UNIQUE_VIOLATION = "23505";
