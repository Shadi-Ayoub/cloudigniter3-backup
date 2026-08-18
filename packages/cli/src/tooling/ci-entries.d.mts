export const OUT_DIR: "dist";
export const TMP_TYPES_DIR: "dist/.types-tmp";

export const ENTRY_KIND: {
  readonly CLIENT: "client";
  readonly RSC: "rsc";
  readonly OTHER: "other";
};

export type CiEntryMap = Record<string, string>;

export type CiResolvedEntries = {
  clientEntries: CiEntryMap;
  rscEntries: CiEntryMap;
  otherEntries: CiEntryMap;
  allEntries: CiEntryMap;
};

export function getAllEntries(): Promise<CiResolvedEntries>;
export function outKeyToJs(outKey: string): string;
export function outKeyToDts(outKey: string): string;
export function srcFileToTmpDts(absSrc: string): string;
