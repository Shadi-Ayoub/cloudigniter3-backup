import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

import type { ConfigJson } from './types';

export function readConfigJson(p = 'amplify/custom/config.json'): ConfigJson {
  try {
    const abs = resolve(process.cwd(), p);
    return JSON.parse(readFileSync(abs, 'utf8')) as ConfigJson;
  } catch {
    return {};
  }
}

// export function writeConfigJson(
//   update: Partial<ConfigJson>,
//   p = 'amplify/custom/config.json'
// ) {
//   const abs = resolve(process.cwd(), p);
//   mkdirSync(dirname(abs), { recursive: true });
//   const prev = readConfigJson(p);
//   const next = { ...prev, ...update };
//   writeFileSync(abs, JSON.stringify(next, null, 2), 'utf8');
// }
