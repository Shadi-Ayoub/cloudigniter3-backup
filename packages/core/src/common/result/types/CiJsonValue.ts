import type { CiJsonPrimitive } from './';

export type CiJsonValue = CiJsonPrimitive | { [k: string]: CiJsonValue } | CiJsonValue[];
