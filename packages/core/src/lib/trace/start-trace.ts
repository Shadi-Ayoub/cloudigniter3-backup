import { CiTraceLogger } from "./trace-logger";
import { type CiTraceLoggerOptions } from "@ci-core/types";

export type StartTraceInit = {
  /** Optional timer name added to metric's `for` when the timer stops */
  name?: string;
  /** Extra fields merged into the metric record */
  base?: Record<string, unknown>;
};

export type TraceLoggerLike = Pick<
  CiTraceLogger,
  | "log"
  | "wave"
  | "start"
  | "stop"
  | "startTimer"
  | "time"
  | "setEnabled"
  | "setFilePath"
  | "setEndpoint"
  | "setTag"
>;

type StartTraceResult = {
  logger: TraceLoggerLike;
  done: (extra?: Record<string, unknown>) => void;
};

const NOOP_DONE: StartTraceResult["done"] = () => {};

const noopTraceLogger: TraceLoggerLike = {
  log(): void {},
  wave(): void {},
  start(): string {
    return "noop";
  },
  stop(): void {},
  startTimer(): (extra?: Record<string, unknown>) => void {
    return NOOP_DONE;
  },
  async time<T>(_label: string, fn: () => Promise<T> | T): Promise<T> {
    return await fn();
  },
  setEnabled(): void {},
  setFilePath(): void {},
  setEndpoint(): void {},
  setTag(): void {},
};

function isTraceSource(
  value: CiTraceLoggerOptions["source"] | undefined,
): value is CiTraceLoggerOptions["source"] {
  return value === "server" || value === "client";
}

function mergeTraceLoggerOptions(
  baseConfig?: Partial<CiTraceLoggerOptions>,
  overrides?: Partial<CiTraceLoggerOptions>,
): Partial<CiTraceLoggerOptions> {
  return {
    ...(baseConfig ?? {}),
    ...(overrides ?? {}),
  };
}

function createNoopStartTraceResult(): StartTraceResult {
  return {
    logger: noopTraceLogger,
    done: NOOP_DONE,
  };
}

function createTraceLogger(
  config: Partial<CiTraceLoggerOptions>,
): CiTraceLogger | null {
  if (config.enabled !== true) return null;
  if (!isTraceSource(config.source)) return null;

  return new CiTraceLogger({
    filePath: config.filePath,
    endpoint: config.endpoint,
    enabled: true,
    source: config.source,
    prettyWave: config.prettyWave ?? false,
    truncateRate: config.truncateRate,
    metrics: config.metrics,
    debug: config.debug ?? false,
    tag: config.tag,
  });
}

/**
 * Create a logger (or a no-op one if disabled) and start a timer immediately.
 * Returns { logger, done } where done(extra?) stops the timer and logs the metric.
 *
 * Usage:
 * const { logger, done } = startTrace(
 *   config.traceLog,
 *   { source: "server", prettyWave: true },
 *   { name: "HeaderLogo" }
 * );
 *
 * logger.log({
 *   type: "component",
 *   name: "HeaderLogo",
 *   scope: "layout",
 *   event: "Rendering the <Layout> component",
 * });
 *
 * done(); // emits { type: "metric", for: "HeaderLogo", ms, ... }
 */
export function ciStartTrace(
  baseConfig?: Partial<CiTraceLoggerOptions>,
  overrides?: Partial<CiTraceLoggerOptions>,
  init?: StartTraceInit,
): StartTraceResult {
  const mergedConfig = mergeTraceLoggerOptions(baseConfig, overrides);
  const logger = createTraceLogger(mergedConfig);

  if (!logger) {
    return createNoopStartTraceResult();
  }

  const timerName = init?.name ?? "Boot";
  const stopTimer = logger.startTimer(timerName, init?.base);

  return {
    logger,
    done(extra?: Record<string, unknown>): void {
      stopTimer(extra ?? {});
    },
  };
}
