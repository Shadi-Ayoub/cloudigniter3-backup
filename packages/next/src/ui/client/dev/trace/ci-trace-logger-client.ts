import type {
  CiCanonicalRecord,
  CiTraceLoggerOptions,
} from "@cloudigniter/core/types";
import { CiTraceLoggerBase } from "@cloudigniter/core/lib";

const CI_MAX_BEACON_BYTES = 60_000;
const CI_DEFAULT_TAG_CLIENT = "client";

export class CiTraceLoggerClient extends CiTraceLoggerBase {
  constructor(
    options: Omit<CiTraceLoggerOptions, "source"> & { source?: "client" },
  ) {
    super({
      ...options,
      source: "client",
    });
  }

  protected ciEmitWaveBanner(banner: string): void {
    this.ciLog({
      type: "wave",
      name: banner,
    });
  }

  protected ciEmitRecord(record: CiCanonicalRecord): void {
    try {
      let data = this.ciSafeStringify(record);

      if (data.length > CI_MAX_BEACON_BYTES) {
        data = this.ciSafeStringify({
          ...record,
          truncated: true,
          note: "Client payload exceeded size limit and was compacted.",
        });
      }

      const tagValue =
        typeof record.tag === "string" && record.tag.length > 0
          ? record.tag
          : this.tag ?? CI_DEFAULT_TAG_CLIENT;

      const endpoint = this.ciWithTagQuery(tagValue);

      if (
        typeof navigator !== "undefined" &&
        typeof navigator.sendBeacon === "function"
      ) {
        navigator.sendBeacon(
          endpoint,
          new Blob([data], { type: "application/json" }),
        );
        return;
      }

      void fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-ci-tag": tagValue,
        },
        body: data,
        keepalive: true,
        cache: "no-store",
      });
    } catch (error) {
      console.error("[CiTraceLoggerClient] failed:", error);
    }
  }
}
