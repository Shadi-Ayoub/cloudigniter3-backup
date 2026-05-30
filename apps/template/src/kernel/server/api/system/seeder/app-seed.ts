import { cache } from "react";

import { ciNormalizeThrownError } from "@cloudigniter/core/lib";
import { ciReadMocksForItem } from "@cloudigniter/core/server";
import type {
  CiRequest,
  CiResponse,
  CiSeederErrorBody,
  CiSeederInput,
  CiSeederInputItem,
  CiSeederItemKey,
  CiSeederResponseBody,
} from "@cloudigniter/core/types";

import { appClearItem, appSeedItem } from "./app-seeder-service";

type SeederResponse = CiResponse<
  CiSeederResponseBody,
  CiSeederErrorBody,
  200,
  400
>;

export const appSeed = cache(
  async (request: CiRequest<CiSeederInput>): Promise<SeederResponse> => {
    if (
      request?.envMode &&
      request.envMode !== "test" &&
      request.envMode !== "development"
    ) {
      return {
        ok: false,
        statusCode: 400,
        body: {
          error: `Invalid envMode in request: ${request.envMode}. envMode must be "test" or "sandbox".`,
          action: request.input?.action ?? "seed",
          items: request.input?.items ?? [],
          results: [],
        },
      };
    }

    const input = request.input;

    if (
      !input?.action ||
      !Array.isArray(input.items) ||
      input.items.length === 0
    ) {
      return {
        ok: false,
        statusCode: 400,
        body: {
          error:
            "Invalid seeder request: action and non-empty items are required.",
          action: input?.action ?? "seed",
          items: input?.items ?? [],
          results: (input?.items ?? []).map((item) => ({
            item: item as CiSeederItemKey,
            ok: false,
            message:
              "Invalid seeder request: action and non-empty items are required.",
          })),
        },
      };
    }

    const { action, items } = input;

    const results: CiSeederResponseBody["results"] = [];

    const seedRequest: CiRequest<CiSeederInputItem> = {
      input: { item: "", seedSetId: "seeder-tool", mock: [] },
      envMode: request.envMode,
      authMode: request.authMode,
      options: request.options,
      critical: request.critical,
    };

    for (const item of items) {
      try {
        if (action === "seed") {
          const mock = (await ciReadMocksForItem(item)) as unknown[];

          const r = await appSeedItem({
            ...seedRequest,
            input: { ...seedRequest.input, item, mock },
          });

          results.push({
            item,
            ok: true,
            message: r.message,
            count: r.count,
          });
        } else if (action === "clear") {
          const r = await appClearItem({
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
          normalizedItemErr.message,
        );

        results.push({
          item: item as CiSeederItemKey,
          ok: false,
          message: "Seeder operation failed for this item.",
          error: normalizedItemErr,
        });
      }
    }

    const hasErrors = results.some((r) => !r.ok);

    if (hasErrors) {
      const failedResults: CiSeederErrorBody["results"] = results
        .filter((r) => !r.ok)
        .map((r) => ({
          item: r.item,
          ok: false,
          message: r.message ?? "Seeder operation failed for this item.",
        }));

      return {
        ok: false,
        statusCode: 400,
        body: {
          error: "Seeder request completed with one or more failed items.",
          action,
          items,
          results: failedResults,
        },
      };
    }

    return {
      ok: true,
      statusCode: 200,
      body: {
        action,
        items,
        results,
      },
    };
  },
);
