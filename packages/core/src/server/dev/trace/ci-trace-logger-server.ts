import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

import { CiTraceLoggerBase } from "@ci-core/lib";
import type { CiCanonicalRecord, CiTraceLoggerOptions } from "@ci-core/types";

export class CiTraceLoggerServer extends CiTraceLoggerBase {
  private initDone = false;

  constructor(
    options: Omit<CiTraceLoggerOptions, "source"> & { source?: "server" },
  ) {
    super({
      ...options,
      source: "server",
    });
  }

  private ciEnsureServerInit(): void {
    if (this.initDone || !this.filePath) return;

    try {
      fs.mkdirSync(path.dirname(this.filePath), {
        recursive: true,
      });
    } catch {
      // intentionally ignored
    }

    this.initDone = true;
  }

  protected ciEmitRecord(record: CiCanonicalRecord): void {
    if (!this.filePath) {
      if (this.debug) console.warn("[CiTraceLoggerServer] filePath not set.");
      return;
    }

    this.ciEnsureServerInit();

    try {
      fs.appendFileSync(this.filePath, `${this.ciSafeStringify(record)}\n`);
    } catch (error) {
      console.error("[CiTraceLoggerServer] appendFileSync failed:", error);
    }
  }

  protected ciEmitWaveBanner(banner: string): void {
    if (!this.filePath) return;

    this.ciEnsureServerInit();

    try {
      fs.appendFileSync(this.filePath, `${banner}\n`);
    } catch {
      // intentionally ignored
    }
  }

  private ciSecureRand(): number {
    const bytes = randomBytes(6);
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

  private ciTruncateKeepLastWave(): void {
    if (!this.filePath) return;

    this.ciEnsureServerInit();

    try {
      const buffer = fs.readFileSync(this.filePath);
      if (buffer.length === 0) return;

      const jsonMarker = Buffer.from('\n{"type":"wave"');
      const prettyMarker = Buffer.from("\n# ===== WAVE");

      let start = -1;

      const jsonIndex = buffer.lastIndexOf(jsonMarker);
      if (jsonIndex >= 0) start = jsonIndex + 1;

      const prettyIndex = buffer.lastIndexOf(prettyMarker);
      if (prettyIndex >= 0) start = Math.max(start, prettyIndex + 1);

      if (start <= 0) return;

      fs.writeFileSync(this.filePath, buffer.subarray(start));
    } catch {
      // intentionally ignored
    }
  }

  protected override ciMaybeTruncateOnWave(): void {
    if (!this.filePath) return;
    if (this.truncateRate <= 0) return;

    if (this.ciSecureRand() < this.truncateRate) {
      this.ciTruncateKeepLastWave();
    }
  }

  public override setFilePath(absPath: string): void {
    this.filePath = absPath;
    this.initDone = false;
  }
}
