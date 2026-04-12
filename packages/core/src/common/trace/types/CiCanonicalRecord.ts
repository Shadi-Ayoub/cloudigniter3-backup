import type { CiLogEntryType } from "./CiLogEntryType";

type CiBaseFields = {
  /** canonical order fields (we build the object in this exact order) */
  t: number;
  iso: string;
  src: "server" | "client";
  type: CiLogEntryType;
};

export type CiCanonicalRecord = CiBaseFields & {
  /** one of `name` (component/function/wave) or `for` (metric) is present */
  name?: string;
  for?: string;
  caller?: string;
  scope?: unknown;
  event?: unknown;
  tag?: unknown;
  via?: "file" | "api";
  [key: string]: unknown;
};
