import type { CiJsonPrimitive } from "./CiJsonPrimitive";

export type CiJsonValue =
  | CiJsonPrimitive
  | { [k: string]: CiJsonValue }
  | CiJsonValue[];
