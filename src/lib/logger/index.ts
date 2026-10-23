type Level = "debug" | "info" | "warn" | "error";

const order: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

// Read directly so the logger works in scripts that skip env validation.
const minLevel = (process.env.LOG_LEVEL as Level | undefined) ?? "info";

type Context = { requestId?: string } & Record<string, unknown>;

function write(level: Level, message: string, context: Context = {}) {
  if (order[level] < order[minLevel]) return;
  const line = JSON.stringify({ level, message, time: new Date().toISOString(), ...context });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (message: string, context?: Context) => write("debug", message, context),
  info: (message: string, context?: Context) => write("info", message, context),
  warn: (message: string, context?: Context) => write("warn", message, context),
  error: (message: string, context?: Context) => write("error", message, context),
};
