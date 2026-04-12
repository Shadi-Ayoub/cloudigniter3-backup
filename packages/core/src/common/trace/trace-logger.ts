import type {
  CiBuildCanonicalInput,
  CiCanonicalRecord,
  CiLogEntryType,
  CiMetricConfig,
  CiTimerRecord,
  CiTraceLoggerOptions,
} from "./types";

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
const CI_MAX_BEACON_BYTES = 60_000;
const CI_DEFAULT_TAG_SERVER = "server";
const CI_DEFAULT_TAG_CLIENT = "client";

export class CiTraceLogger {
  private filePath?: string;
  private endpoint: string;
  private enabled: boolean;
  private source: "server" | "client";
  private prettyWave: boolean;
  private truncateRate: number;
  private metrics: Required<CiMetricConfig>;
  private debug: boolean;
  private tag?: string;

  private fs?: typeof import("fs");
  private path?: typeof import("path");
  private initDone = false;

  private readonly timers = new Map<string, CiTimerRecord>();

  /**
   * Create a new trace logger.
   */
  constructor(options: CiTraceLoggerOptions) {
    if (!options.source) {
      throw new Error(
        '[CiTraceLogger] `source` is required and must be "server" or "client".',
      );
    }

    this.filePath = options.filePath;
    this.endpoint = options.endpoint ?? CI_DEFAULT_TRACE_ENDPOINT;
    this.enabled = options.enabled ?? true;
    this.source = options.source;
    this.prettyWave = Boolean(options.prettyWave);
    this.tag = options.tag;

    const raw = options.truncateRate ?? CI_DEFAULT_TRUNCATE_RATE;
    const asNumber = Number(raw);
    const normalized = asNumber > 1 ? asNumber / 100 : asNumber;

    this.truncateRate = Math.min(
      1,
      Math.max(
        0,
        Number.isFinite(normalized) ? normalized : CI_DEFAULT_TRUNCATE_RATE,
      ),
    );

    this.metrics = {
      duration: options.metrics?.duration !== false,
    };

    this.debug = Boolean(options.debug);
  }

  /**
   * Backward-compatible wrapper.
   */
  public log(entry: Record<string, unknown>): void {
    this.ciLog(entry);
  }

  /**
   * Backward-compatible wrapper.
   */
  public wave(label?: string, extra?: Record<string, unknown>): void {
    this.ciWave(label, extra);
  }

  /**
   * Backward-compatible wrapper.
   */
  public start(label: string, base?: Record<string, unknown>): string {
    return this.ciStart(label, base);
  }

  /**
   * Backward-compatible wrapper.
   */
  public stop(handle: string, extra: Record<string, unknown> = {}): void {
    this.ciStop(handle, extra);
  }

  /**
   * Backward-compatible wrapper.
   */
  public startTimer(label: string, base?: Record<string, unknown>) {
    return this.ciStartTimer(label, base);
  }

  /**
   * Backward-compatible wrapper.
   */
  public async time<T>(
    label: string,
    fn: () => Promise<T> | T,
    base?: Record<string, unknown>,
  ): Promise<T> {
    return this.ciTime(label, fn, base);
  }

  /**
   * Backward-compatible wrapper.
   */
  public setEnabled(value: boolean): void {
    this.ciSetEnabled(value);
  }

  /**
   * Backward-compatible wrapper.
   */
  public setFilePath(absPath: string): void {
    this.ciSetFilePath(absPath);
  }

  /**
   * Backward-compatible wrapper.
   */
  public setEndpoint(url: string): void {
    this.ciSetEndpoint(url);
  }

  /**
   * Backward-compatible wrapper.
   */
  public setTag(tag: string): void {
    this.ciSetTag(tag);
  }

  private get ciIsNode(): boolean {
    return (
      typeof process !== "undefined" &&
      typeof process.versions?.node === "string" &&
      !("EdgeRuntime" in globalThis)
    );
  }

  private ciEnsureServerInit(): void {
    if (!this.ciIsNode || this.initDone || !this.filePath) return;

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    this.fs = require("fs") as typeof import("fs");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    this.path = require("path") as typeof import("path");

    try {
      this.fs.mkdirSync(this.path.dirname(this.filePath), {
        recursive: true,
      });
    } catch {
      // intentionally ignored
    }

    this.initDone = true;
  }

  private ciNowMs(): number {
    if (this.ciIsNode && typeof process.hrtime?.bigint === "function") {
      return Number(process.hrtime.bigint() / 1_000_000n);
    }

    if (
      typeof performance !== "undefined" &&
      typeof performance.now === "function"
    ) {
      return performance.now();
    }

    return Date.now();
  }

  private ciSecureRand(): number {
    if (this.ciIsNode) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { randomBytes } = require("crypto") as typeof import("crypto");
      const bytes: Uint8Array = randomBytes(6);

      const [b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0] = bytes;

      const n =
        b0 * 2 ** 40 +
        b1 * 2 ** 32 +
        b2 * 2 ** 24 +
        b3 * 2 ** 16 +
        b4 * 2 ** 8 +
        b5;

      return n / 2 ** 48;
    }

    if (
      typeof crypto !== "undefined" &&
      typeof crypto.getRandomValues === "function"
    ) {
      const values = new Uint32Array(1);
      crypto.getRandomValues(values);
      return (values[0] ?? 0) / 2 ** 32;
    }

    return Math.random();
  }

  /**
   * JSON-safe stringify that handles circular refs and Error objects.
   */
  private ciSafeStringify(input: unknown): string {
    const seen = new WeakSet<object>();

    const replacer = (_key: string, value: unknown): unknown => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) return "[Circular]";
        seen.add(value);

        if (value instanceof Error) {
          const cause =
            "cause" in value
              ? (value as Error & { cause?: unknown }).cause
              : undefined;

          return {
            name: value.name,
            message: value.message,
            stack: value.stack,
            cause,
          };
        }
      }

      return value;
    };

    return JSON.stringify(input, replacer);
  }

  /**
   * Build endpoint with ?tag=...
   */
  private ciWithTagQuery(tag: string): string {
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
    if (type === "component") {
      return name.startsWith("<") && name.endsWith(">") ? name : `<${name}>`;
    }

    if (type === "function") {
      return name.endsWith("()") ? name : `${name}()`;
    }

    return name;
  }

  private ciFormatMetricFor(forValue: string): string {
    return forValue.startsWith("<") && forValue.endsWith(">")
      ? forValue
      : `<${forValue}>`;
  }

  private ciBuildCanonical(input: CiBuildCanonicalInput): CiCanonicalRecord {
    const timestamp = Date.now();
    const iso = new Date(timestamp).toISOString();
    const via: "file" | "api" = this.ciIsNode ? "file" : "api";
    const resolvedTag = typeof input.tag === "string" ? input.tag : this.tag;

    const record: CiCanonicalRecord = {
      t: timestamp,
      iso,
      src: this.source,
      type: input.type,
    };

    if (input.type === "metric") {
      record.name = "duration";

      if (input.for_ !== undefined) {
        record.for = this.ciFormatMetricFor(String(input.for_));
      }
    } else if (input.name !== undefined) {
      record.name = this.ciFormatNameForType(input.type, input.name);
    }

    if (input.type === "function" && input.caller !== undefined) {
      record.caller = input.caller;
    }

    if (input.scope !== undefined) record.scope = input.scope;
    if (input.event !== undefined) record.event = input.event;
    if (resolvedTag !== undefined) record.tag = resolvedTag;
    record.via = via;

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

  private ciGetTagValue(record: CiCanonicalRecord): string {
    if (typeof record.tag === "string" && record.tag.length > 0) {
      return record.tag;
    }

    if (typeof this.tag === "string" && this.tag.length > 0) {
      return this.tag;
    }

    return this.ciIsNode ? CI_DEFAULT_TAG_SERVER : CI_DEFAULT_TAG_CLIENT;
  }

  /**
   * CloudIgniter-native log method.
   */
  public ciLog(entry: Record<string, unknown>): void {
    if (!this.enabled) return;

    const rawType =
      typeof entry.type === "string" ? entry.type.toLowerCase() : "";

    if (!this.ciIsValidLogEntryType(rawType)) {
      if (this.debug) {
        console.warn(
          "[CiTraceLogger] Invalid or missing `type` in log entry:",
          entry,
        );
      }
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

    if (this.ciIsNode) {
      if (!this.filePath) {
        if (this.debug) {
          console.warn(
            "[CiTraceLogger] filePath not set; skipping file write.",
          );
        }
        return;
      }

      this.ciEnsureServerInit();

      if (!this.fs) {
        if (this.debug) {
          console.warn(
            "[CiTraceLogger] fs is not initialized; skipping file write.",
          );
        }
        return;
      }

      try {
        this.fs.appendFileSync(
          this.filePath,
          `${this.ciSafeStringify(record)}\n`,
        );

        if (this.debug) {
          console.log("[CiTraceLogger] wrote line to", this.filePath, record);
        }
      } catch (error: unknown) {
        console.error("[CiTraceLogger] appendFileSync failed:", error);
      }

      return;
    }

    try {
      let data = this.ciSafeStringify(record);

      if (data.length > CI_MAX_BEACON_BYTES) {
        const compactRecord = this.ciBuildCanonical({
          type: rawType,
          name: typeof name === "string" ? name : undefined,
          for_: forKey === undefined ? undefined : String(forKey),
          scope,
          event,
          tag,
          extra: {
            truncated: true,
            note: "Client payload exceeded size limit and was compacted.",
          },
        });

        data = this.ciSafeStringify(compactRecord);

        if (this.debug) {
          console.warn("[CiTraceLogger] payload truncated");
        }
      }

      const tagValue = this.ciGetTagValue(record);
      const endpointWithTag = this.ciWithTagQuery(tagValue);

      if (
        typeof navigator !== "undefined" &&
        typeof navigator.sendBeacon === "function"
      ) {
        const ok = navigator.sendBeacon(
          endpointWithTag,
          new Blob([data], { type: "application/json" }),
        );

        if (this.debug && !ok) {
          console.warn("[CiTraceLogger] sendBeacon returned false");
        }

        return;
      }

      void fetch(endpointWithTag, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-ci-tag": tagValue,
        },
        body: data,
        keepalive: true,
        cache: "no-store",
      });
    } catch (error: unknown) {
      console.error("[CiTraceLogger] client POST failed:", error);
    }
  }

  /**
   * Emit a wave marker.
   */
  public ciWave(label?: string, extra?: Record<string, unknown>): void {
    this.ciMaybeTruncateOnWave();

    this.ciLog({
      type: "wave",
      name: label ?? null,
      ...(extra ?? {}),
    });

    if (!this.prettyWave) return;

    const timestamp = Date.now();
    const banner = `# ===== WAVE | ${new Date(timestamp).toISOString()}${
      label ? ` | ${label}` : ""
    } =====`;

    if (this.ciIsNode && this.filePath) {
      this.ciEnsureServerInit();

      if (!this.fs) return;

      try {
        this.fs.appendFileSync(this.filePath, `${banner}\n`);
      } catch {
        // intentionally ignored
      }

      return;
    }

    this.ciLog({ type: "wave", name: banner });
  }

  /**
   * Start a timer and return its handle.
   */
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

  /**
   * Stop a timer and emit duration metric if enabled.
   */
  public ciStop(handle: string, extra: Record<string, unknown> = {}): void {
    const timerRecord = this.timers.get(handle);
    if (!timerRecord) return;

    this.timers.delete(handle);

    if (!this.metrics.duration) return;

    const durationMs = this.ciNowMs() - timerRecord.t0;

    this.ciLog({
      type: "metric",
      for: timerRecord.label,
      ms: durationMs,
      ...(timerRecord.base ?? {}),
      ...extra,
    });
  }

  /**
   * Start a timer and return an end function.
   */
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

  /**
   * Time a sync or async function.
   */
  public async ciTime<T>(
    label: string,
    fn: () => Promise<T> | T,
    base?: Record<string, unknown>,
  ): Promise<T> {
    if (!this.metrics.duration) {
      return await fn();
    }

    const end = this.ciStartTimer(label, base);

    try {
      const result = await fn();
      end({ phase: "ok" });
      return result;
    } catch (error: unknown) {
      end({
        phase: "error",
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  public ciSetEnabled(value: boolean): void {
    this.enabled = value;
  }

  public ciSetFilePath(absPath: string): void {
    this.filePath = absPath;
    this.initDone = false;
  }

  public ciSetEndpoint(url: string): void {
    this.endpoint = url;
  }

  public ciSetTag(tag: string): void {
    this.tag = tag;
  }

  private ciTruncateKeepLastWave(): void {
    if (!this.ciIsNode || !this.filePath) return;

    this.ciEnsureServerInit();

    if (!this.fs) return;

    try {
      const buffer: Buffer = this.fs.readFileSync(this.filePath);
      if (buffer.length === 0) return;

      const jsonMarker = Buffer.from('\n{"type":"wave"');
      const prettyMarker = Buffer.from("\n# ===== WAVE");

      let start = -1;

      const jsonIndex = buffer.lastIndexOf(jsonMarker);
      if (jsonIndex >= 0) {
        start = jsonIndex + 1;
      }

      const prettyIndex = buffer.lastIndexOf(prettyMarker);
      if (prettyIndex >= 0) {
        start = Math.max(start, prettyIndex + 1);
      }

      if (start <= 0) return;

      const tail = buffer.subarray(start);
      this.fs.writeFileSync(this.filePath, tail);
    } catch {
      // intentionally ignored
    }
  }

  private ciMaybeTruncateOnWave(): void {
    if (!this.ciIsNode || !this.filePath) return;
    if (this.truncateRate <= 0) return;

    if (this.ciSecureRand() < this.truncateRate) {
      this.ciTruncateKeepLastWave();
    }
  }
}
