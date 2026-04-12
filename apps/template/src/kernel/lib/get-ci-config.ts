import { cache } from 'react';
import { startTrace } from '@cloudigniter/next/trace';
import type { Config } from '@cloudigniter/next/types';

import rawConfig from '@/../cloudigniter.config';

const ciConfig = rawConfig as Config;

/** Pure, parameterless cached getter (no side effects). */
const _getConfig = cache(() => ciConfig);

/** Dev-only, per-caller log (once per caller). Edge-safe. */
const seenCallers = new Set<string>();
function devTraceCallerOnce(caller: string) {
  if (process.env.NODE_ENV === 'production') return;
  const name = caller || 'unknown';
  if (seenCallers.has(name)) return;
  seenCallers.add(name);

  const isEdge = process.env.NEXT_RUNTIME === 'edge';
  try {
    if (!isEdge) {
      const { logger } = startTrace(
        ciConfig.traceLog,
        { source: 'server', prettyWave: true },
        { name: 'getConfig' }
      );
      logger.log({
        type: 'function',
        name: 'getConfig',
        scope: 'method',
        event: `getConfig(): caller='${name}', CloudIgniter configuration loaded from cloudigniter.config.ts.`,
        caller,
      });
    } else {
      // Keep Edge runtime free of filesystem I/O
      console.info(`[getConfig] (edge) accessed by "${name}"`);
    }
  } catch (err) {
    // Never break rendering due to tracing errors
    console.info(`[getConfig] dev trace failed for caller "${name}":`, err);
  }
}

/** Public API: guard, log caller (dev only), return cached config. */
export function getConfig(caller: string = 'unknown'): Config {
  // ✅ Guard is inside the function, not at module scope
  if (typeof window !== 'undefined') {
    throw new Error(
      'getConfig() must be called on the server (not in the browser).'
    );
  }
  devTraceCallerOnce(caller);
  return _getConfig();
}
