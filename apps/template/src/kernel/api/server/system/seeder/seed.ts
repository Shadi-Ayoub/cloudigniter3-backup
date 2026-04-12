import { cache } from 'react';

import { ciNormalizeThrownError } from '@cloudigniter/next/utility';
import { readMocksForItem } from '@cloudigniter/next/utility/server';
import type {
  CiRequest,
  CiResponse,
  SeederErrorBody,
  SeederInput,
  SeederInputItem,
  SeederItemKey,
  SeederResponseBody,
} from '@cloudigniter/next/types';

import { clearItem, seedItem } from './seeder-service';

// import { promises as fs } from 'fs';

// Folder required by your requirement
// const MOCKS_DIR = path.join(process.cwd(), 'src', 'custom', 'testing', 'mocks');

/**
 *
 */
export const seed = cache(
  async (request: CiRequest<SeederInput>): Promise<CiResponse> => {
    // const files = await fs.readdir(MOCKS_DIR);
    // const preferred = `$tenants-mock.json`;
    // const exact = files.find((f) => f === preferred);

    // Guard: only allow requested envMode = 'test' | 'sandbox'
    if (
      request?.envMode &&
      request.envMode !== 'test' &&
      request.envMode !== 'sandbox'
    ) {
      return {
        statusCode: 400,
        body: {
          error: `Invalid envMode in request: ${request.envMode}. envMode must be "test" or "sandbox".`,
        },
      };
    }

    const input = request.input;

    if (
      !input?.action ||
      !Array.isArray(input.items) ||
      input.items.length === 0
    ) {
      const bad: CiResponse<SeederResponseBody, SeederErrorBody, 400> = {
        statusCode: 400,
        body: {
          error:
            'Invalid seeder request: action and non-empty items are required.',
          action: input?.action ?? 'seed',
          items: input?.items ?? [],
          results: (input?.items ?? []).map((item) => ({
            item: item as SeederItemKey,
            ok: false,
            message:
              'Invalid seeder request: action and non-empty items are required.',
          })),
        },
      };

      return bad;
    }

    const { action, items } = input;

    const results: SeederResponseBody['results'] = [];

    const seedRequest: CiRequest<SeederInputItem> = {
      input: { item: '', seedSetId: 'seeder-tool', mock: [] },
      envMode: request.envMode,
      authMode: request.authMode,
      options: request.options,
      critical: request.critical,
    };

    let mock;

    for (const item of items) {
      try {
        if (action === 'seed') {
          const m = await readMocksForItem(item);
          mock = m as unknown[];

          const r = await seedItem({
            ...seedRequest,
            input: { ...seedRequest.input, item, mock },
          });

          results.push({
            item,
            ok: true,
            message: r.message,
            count: r.count,
          });
        } else if (action === 'clear') {
          const r = await clearItem({
            ...seedRequest,
            input: { ...seedRequest.input, item },
          });
          results.push({
            item,
            ok: true,
            message: r.message,
            count: r.count,
          });
        } else {
          results.push({
            item,
            ok: false,
            message: `Unsupported action: ${String(action)}`,
          });
        }
      } catch (itemError: unknown) {
        const normalizedItemErr = ciNormalizeThrownError(itemError);
        console.error(
          `[Seeder] ${action} failed for "${item}":`,
          normalizedItemErr.message
        );

        results.push({
          item: item as SeederItemKey,
          ok: true,
          message: 'Seeder operation failed for this item.',
          error: normalizedItemErr,
        });
      }
    }

    // const message = JSON.stringify(mock);
    // results.push({ item: 'tenants' as SeederItemKey, ok: false, message });

    const statusCode = results.some((r) => !r.ok) ? 400 : 200;

    let response: CiResponse<SeederResponseBody>;

    if (statusCode === 200) {
      response = {
        statusCode: 200,
        body: { action, items, results },
      };
    } else {
      response = {
        statusCode: 400,
        body: {
          error: 'Bad request',
          fieldErrors: { results: `,,,${JSON.stringify(results)}` },
        },
      };
    }

    return response;
  }
);

// import path from 'path';
// import { promises as fs } from 'fs';

// import type { SeederItemKey } from '@CI/types';

// Folder required by your requirement
// const MOCKS_DIR = path.join(process.cwd(), 'custom', 'testing', 'mocks');

// export async function readMocksForItem(item: SeederItemKey): Promise<unknown> {
//   const files = await fs.readdir(MOCKS_DIR);

//   // Prefer explicit `${item}-mock.json`
//   const preferred = `${item}-mock.json`;
//   const exact = files.find((f) => f === preferred);

//   const match =
//     exact ??
//     files.find((f) => f.startsWith(`${item}-`) && f.endsWith('-mock.json')) ??
//     files.find(
//       (f) => f.startsWith(item) && f.includes('-mock') && f.endsWith('.json')
//     );

//   if (!match) {
//     throw new Error(`No mock file found for item "${item}" in ${MOCKS_DIR}`);
//   }

//   const fullPath = path.join(MOCKS_DIR, match);
//   const raw = await fs.readFile(fullPath, 'utf8');

//   try {
//     return JSON.parse(raw);
//   } catch {
//     throw new Error(`Invalid JSON in mock file: ${match}`);
//   }
// }
