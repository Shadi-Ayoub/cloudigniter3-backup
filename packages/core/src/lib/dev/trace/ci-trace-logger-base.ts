import type {
  CiBuildCanonicalInput,
  CiCanonicalRecord,
  CiLogEntryType,
  CiMetricConfig,
  CiTimerRecord,
  CiTraceLoggerOptions,
} from "@ci-core/types";

const CI_LOG_ENTRY_TYPES: ReadonlySet<CiLogEntryType> = new Set([
  "component",
  "function",
  "metric",
  "wave",
]);

const CI_PROTECTED_CANONICAL_KEYS: ReadonlySet<string> = new Set([
  "t",
  "iso",
  "src",
  "type",
  "name",
  "caller",
  "for",
  "scope",
  "event",
  "tag",
  "via",
]);

const CI_DEFAULT_TRACE_ENDPOINT = "/ci-internal/trace-append";
const CI_DEFAULT_TRUNCATE_RATE = 0.5;

export abstract class CiTraceLoggerBase {
  protected filePath?: string;
  protected endpoint: string;
  protected enabled: boolean;
  protected source: "server" | "client";
  protected prettyWave: boolean;
  protected truncateRate: number;
  protected metrics: Required<CiMetricConfig>;
  protected debug: boolean;
  protected tag?: string;

  private readonly timers = new Map<string, CiTimerRecord>();

  constructor(options: CiTraceLoggerOptions) {
    if (!options.source) {
      throw new Error("[CiTraceLogger] `source` is required.");
    }

    this.filePath = options.filePath;
    this.endpoint = options.endpoint ?? CI_DEFAULT_TRACE_ENDPOINT;
    this.enabled = options.enabled ?? true;
    this.source = options.source;
    this.prettyWave = Boolean(options.prettyWave);
    this.tag = options.tag;
    this.debug = Boolean(options.debug);

    const raw = options.truncateRate ?? CI_DEFAULT_TRUNCATE_RATE;
    const asNumber = Number(raw);
    const normalized = asNumber > 1 ? asNumber / 100 : asNumber;

    this.truncateRate = Math.min(
      1,
      Math.max(
        0,
        Number.isFinite(normalized)
          ? normalized
          : CI_DEFAULT_TRACE_ENDPOINT.length,
      ),
    );

    this.metrics = {
      duration: options.metrics?.duration !== false,
    };
  }

  protected abstract ciEmitRecord(record: CiCanonicalRecord): void;
  protected abstract ciEmitWaveBanner(banner: string): void;
  protected ciMaybeTruncateOnWave(): void {}

  public log(entry: Record<string, unknown>): void {
    this.ciLog(entry);
  }

  public wave(label?: string, extra?: Record<string, unknown>): void {
    this.ciWave(label, extra);
  }

  public start(label: string, base?: Record<string, unknown>): string {
    return this.ciStart(label, base);
  }

  public stop(handle: string, extra: Record<string, unknown> = {}): void {
    this.ciStop(handle, extra);
  }

  public startTimer(label: string, base?: Record<string, unknown>) {
    return this.ciStartTimer(label, base);
  }

  public async time<T>(
    label: string,
    fn: () => Promise<T> | T,
    base?: Record<string, unknown>,
  ): Promise<T> {
    return this.ciTime(label, fn, base);
  }

  public setEnabled(value: boolean): void {
    this.enabled = value;
  }

  public setFilePath(absPath: string): void {
    this.filePath = absPath;
  }

  public setEndpoint(url: string): void {
    this.endpoint = url;
  }

  public setTag(tag: string): void {
    this.tag = tag;
  }

  protected ciNowMs(): number {
    if (
      typeof performance !== "undefined" &&
      typeof performance.now === "function"
    ) {
      return performance.now();
    }

    return Date.now();
  }

  protected ciSafeStringify(input: unknown): string {
    const seen = new WeakSet<object>();

    return JSON.stringify(input, (_key, value): unknown => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) return "[Circular]";
        seen.add(value);

        if (value instanceof Error) {
          return {
            name: value.name,
            message: value.message,
            stack: value.stack,
            cause: "cause" in value ? value.cause : undefined,
          };
        }
      }

      return value;
    });
  }

  protected ciWithTagQuery(tag: string): string {
    try {
      const base =
        typeof location !== "undefined" ? location.origin : "http://localhost";
      const url = new URL(this.endpoint, base);
      url.searchParams.set("tag", String(tag).slice(0, 64));
      return url.toString();
    } catch {
      const separator = this.endpoint.includes("?") ? "&" : "?";
      return `${this.endpoint}${separator}tag=${encodeURIComponent(
        String(tag).slice(0, 64),
      )}`;
    }
  }

  private ciFormatNameForType(type: CiLogEntryType, name: string): string {
    if (type === "component")
      return name.startsWith("<") && name.endsWith(">") ? name : `<${name}>`;
    if (type === "function") return name.endsWith("()") ? name : `${name}()`;
    return name;
  }

  private ciFormatMetricFor(value: string): string {
    return value.startsWith("<") && value.endsWith(">") ? value : `<${value}>`;
  }

  protected ciBuildCanonical(input: CiBuildCanonicalInput): CiCanonicalRecord {
    const timestamp = Date.now();

    const record: CiCanonicalRecord = {
      t: timestamp,
      iso: new Date(timestamp).toISOString(),
      src: this.source,
      type: input.type,
      via: this.source === "server" ? "file" : "api",
    };

    if (input.type === "metric") {
      record.name = "duration";
      if (input.for_ !== undefined)
        record.for = this.ciFormatMetricFor(String(input.for_));
    } else if (input.name !== undefined) {
      record.name = this.ciFormatNameForType(input.type, input.name);
    }

    if (input.type === "function" && input.caller !== undefined)
      record.caller = input.caller;
    if (input.scope !== undefined) record.scope = input.scope;
    if (input.event !== undefined) record.event = input.event;
    if (input.tag !== undefined) record.tag = String(input.tag);
    else if (this.tag !== undefined) record.tag = this.tag;

    if (input.extra && typeof input.extra === "object") {
      const target = record as Record<string, unknown>;

      for (const [key, value] of Object.entries(input.extra)) {
        if (value === undefined) continue;
        if (CI_PROTECTED_CANONICAL_KEYS.has(key)) continue;
        target[key] = value;
      }
    }

    return record;
  }

  private ciIsValidLogEntryType(value: unknown): value is CiLogEntryType {
    return (
      typeof value === "string" &&
      CI_LOG_ENTRY_TYPES.has(value as CiLogEntryType)
    );
  }

  public ciLog(entry: Record<string, unknown>): void {
    if (!this.enabled) return;

    const rawType =
      typeof entry.type === "string" ? entry.type.toLowerCase() : "";

    if (!this.ciIsValidLogEntryType(rawType)) {
      if (this.debug) console.warn("[CiTraceLogger] Invalid log entry:", entry);
      return;
    }

    const { name, scope, event, tag, ms, phase, caller, ...rest } = entry;
    const forKey = entry["for"];

    const record = this.ciBuildCanonical({
      type: rawType,
      name: typeof name === "string" ? name : undefined,
      caller:
        rawType === "function" && typeof caller === "string"
          ? caller
          : undefined,
      for_: forKey === undefined ? undefined : String(forKey),
      scope,
      event,
      tag,
      extra: rawType === "metric" ? { ms, phase, ...rest } : { ...rest },
    });

    this.ciEmitRecord(record);
  }

  public ciWave(label?: string, extra?: Record<string, unknown>): void {
    this.ciMaybeTruncateOnWave();

    this.ciLog({
      type: "wave",
      name: label ?? null,
      ...(extra ?? {}),
    });

    if (!this.prettyWave) return;

    const banner = `# ===== WAVE | ${new Date().toISOString()}${
      label ? ` | ${label}` : ""
    } =====`;
    this.ciEmitWaveBanner(banner);
  }

  public ciStart(label: string, base?: Record<string, unknown>): string {
    const id = `${label}:${Date.now()}:${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    this.timers.set(id, {
      t0: this.ciNowMs(),
      label,
      base,
    });

    return id;
  }

  public ciStop(handle: string, extra: Record<string, unknown> = {}): void {
    const timer = this.timers.get(handle);
    if (!timer) return;

    this.timers.delete(handle);

    if (!this.metrics.duration) return;

    this.ciLog({
      type: "metric",
      for: timer.label,
      ms: this.ciNowMs() - timer.t0,
      ...(timer.base ?? {}),
      ...extra,
    });
  }

  public ciStartTimer(label: string, base?: Record<string, unknown>) {
    if (!this.metrics.duration) {
      return (_extra: Record<string, unknown> = {}): void => {
        void _extra;
      };
    }

    const handle = this.ciStart(label, base);

    return (extra: Record<string, unknown> = {}): void => {
      this.ciStop(handle, extra);
    };
  }

  public async ciTime<T>(
    label: string,
    fn: () => Promise<T> | T,
    base?: Record<string, unknown>,
  ): Promise<T> {
    if (!this.metrics.duration) return await fn();

    const end = this.ciStartTimer(label, base);

    try {
      const result = await fn();
      end({ phase: "ok" });
      return result;
    } catch (error) {
      end({
        phase: "error",
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
