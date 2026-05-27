import type { CiTraceLoggerOptions } from "@ci-core/types";
import type {
  CiStartTraceInit,
  CiStartTraceResult,
  CiTraceLoggerFactory,
  CiTraceLoggerLike,
} from "@ci-core/types";

const NOOP_DONE: CiStartTraceResult["done"] = () => {};

const noopTraceLogger: CiTraceLoggerLike = {
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

function mergeTraceLoggerOptions(
  baseConfig?: Partial<CiTraceLoggerOptions>,
  overrides?: Partial<CiTraceLoggerOptions>,
): Partial<CiTraceLoggerOptions> {
  return {
    ...(baseConfig ?? {}),
    ...(overrides ?? {}),
  };
}

function createNoopStartTraceResult(): CiStartTraceResult {
  return {
    logger: noopTraceLogger,
    done: NOOP_DONE,
  };
}

export function ciStartTraceCore(
  createLogger: CiTraceLoggerFactory,
  baseConfig?: Partial<CiTraceLoggerOptions>,
  overrides?: Partial<CiTraceLoggerOptions>,
  init?: CiStartTraceInit,
): CiStartTraceResult {
  const mergedConfig = mergeTraceLoggerOptions(baseConfig, overrides);
  const logger = createLogger(mergedConfig);

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
