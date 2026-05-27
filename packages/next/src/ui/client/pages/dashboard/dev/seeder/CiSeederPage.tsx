"use client";

import { useMemo, useState } from "react";
import { NextIntlClientProvider, useLocale, useMessages } from "next-intl";
import { SEED_ITEMS } from "./seed-items";
import {
  ciIsGraphqlResponse,
  ciNormalizeThrownError,
  ciSafeToString,
} from "@cloudigniter/core/lib";
import { ciCall, ciGetEnvMode } from "@cloudigniter/core/client";

import {
  ciPrintToConsole,
  ciNotify,
  useCiPageLoaderStore,
} from "@cloudigniter/core/client";
import type {
  CiRequest,
  CiResponse,
  CiSeederInput,
  CiSeederResponseBody,
  CiSeederErrorBody,
  CiSeederItemKey,
} from "@cloudigniter/core/types";

type LogLine = {
  ts: string;
  text: string;
  tone?: "info" | "success" | "warning" | "error";
};

export function CiSeederPage() {
  const { setLoading } = useCiPageLoaderStore();
  const locale = useLocale();
  const messages = useMessages();
  // const [successMsg, setSuccessMsg] = useState<string | null>(null);
  // const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [checked, setChecked] = useState<Record<CiSeederItemKey, boolean>>({
    users: false,
    tenants: false,
    orgUnits: false,
  });

  const [isBusy, setIsBusy] = useState(false);
  const [log, setLog] = useState<LogLine[]>([]);

  const selectedItems = useMemo(
    () => (Object.keys(checked) as CiSeederItemKey[]).filter((k) => checked[k]),
    [checked],
  );

  const toneColCh = useMemo(() => {
    // Collect unique tone labels that actually appear (fallback to 'info')
    const set = new Set<string>();
    for (const l of log) set.add(l.tone ?? "info");

    // Longest label length (minimum ensures stable layout even when log is empty)
    const maxLen = Math.max(4, ...Array.from(set).map((s) => s.length)); // 4 = 'info'
    return maxLen + 1; // +1 for a tiny breathing room
  }, [log]);

  function append(text: string, tone: LogLine["tone"] = "info") {
    setLog((prev) => [{ ts: new Date().toISOString(), text, tone }, ...prev]);
  }

  function isSeederOkBody(x: unknown): x is CiSeederResponseBody {
    return (
      !!x &&
      typeof x === "object" &&
      "action" in x &&
      "items" in x &&
      "results" in x &&
      Array.isArray((x as any).results)
    );
  }

  async function run(action: "seed" | "clear") {
    setLoading(true, "Seeding selected items. Please wait...");
    // setSuccessMsg(null);
    // setErrorMsg(null);

    const envMode = ciGetEnvMode();

    if (selectedItems.length === 0) {
      append("No seed items selected.", "warning");
      return;
    }

    const request: CiRequest<CiSeederInput> = {
      input: { action, items: selectedItems },
      envMode,
    };

    setIsBusy(true);
    append(
      `${action.toUpperCase()} started for: ${selectedItems.join(", ")}`,
      "info",
    );

    try {
      const result = await ciCall<
        CiSeederInput,
        CiResponse<CiSeederResponseBody, CiSeederErrorBody>
      >("/dashboard/dev/seeder/seed", request);

      // append(`Result: ${JSON.stringify(result)}`, 'error');

      const ok = result.ok;
      const requestHttpStatusCode = result.httpStatus ?? 200;

      if (!ok) {
        append(
          `Status: ${requestHttpStatusCode}`,
          requestHttpStatusCode >= 400 ? "error" : "success",
        );
        append(
          `Status: ${result.message}`,
          requestHttpStatusCode >= 400 ? "error" : "success",
        );

        // append(`Response: ${JSON.stringify(result.response)}`, requestHttpStatusCode >= 400 ? 'error' : 'success');

        ciPrintToConsole({
          label: "Unexpected error while seeding!",
          message: result.message,
        });

        const errMsg = "Unexpected error while seeding!";

        // setErrorMsg(errMsg);
        ciNotify("error", errMsg);

        setIsBusy(false);
        setLoading(false);

        return;
      }

      const respUnknown = result.response;

      if (
        !ciIsGraphqlResponse<CiSeederResponseBody, CiSeederErrorBody>(
          respUnknown,
        )
      ) {
        const errMsg = `Unexpected response shape: ${ciSafeToString(
          respUnknown,
        )}`;
        append(errMsg, "error");
        // setErrorMsg(errMsg);
        ciNotify("error", errMsg);
        return;
      }

      const statusCode = respUnknown.statusCode ?? 200;
      append(`Status: ${statusCode}`, statusCode >= 400 ? "error" : "success");

      if (statusCode >= 400) {
        // error body (could be SeederErrorBody or your default {error, fieldErrors} shape)
        const errBody = respUnknown.body as CiSeederErrorBody;
        const errMsg =
          (errBody as any)?.error?.toString?.() ??
          (typeof (errBody as any)?.error === "string"
            ? (errBody as any).error
            : null) ??
          "Seeding failed.";
        append(`Error: ${errMsg}`, "error");
        // setErrorMsg(errMsg);
        ciNotify("error", errMsg);
        return;
      }

      // OK body
      if (!isSeederOkBody(respUnknown.body)) {
        const errMsg = `Unexpected OK body shape: ${ciSafeToString(
          respUnknown.body,
        )}`;
        append(errMsg, "error");
        // setErrorMsg(errMsg);
        ciNotify("error", errMsg);
        return;
      }

      const callResponse = respUnknown.body; // ✅ typed as SeederResponseBody
      const results = callResponse.results;

      // append(`Result: ${JSON.stringify(result)}`, 'warning');
      // append(`Status: ${statusCode}`, statusCode >= 400 ? 'error' : 'success');

      for (const r of results) {
        append(
          `${r.item}: ${r.ok ? "OK" : "FAILED"}${
            typeof r.count === "number" ? ` (count=${r.count})` : ""
          }${r.message ? ` — ${r.message}` : ""}`,
          r.ok ? "success" : "error",
        );

        if (!r.ok && r.error) {
          append(
            `${r.item}: error detail: ${ciSafeToString(r.error)}`,
            "error",
          );
        }
      }

      ciPrintToConsole({
        label: "Seeder response:",
        message: callResponse as object,
        options: { format: "JSON", messageType: "SUCCESS" },
      });

      const msg = "Seeding process complete.";

      // setSuccessMsg(msg);
      ciNotify("success", msg);
    } catch (error: unknown) {
      const normalized = ciNormalizeThrownError(error);
      append(`Unexpected client error: ${normalized.message}`, "error");
      const errMsg = `Unexpected error while seeding! ${normalized.message}`;
      ciPrintToConsole({
        label: "[SeederPage] Seeding error:",
        message: error as string,
        options: { messageType: "ERROR" },
      });
      // setErrorMsg(errMsg);
      ciNotify("error", errMsg);
    } finally {
      setIsBusy(false);
      setLoading(false);
    }
  }

  const containerHeightClass =
    // Fixed height between breadcrumb header and footer:
    // Adjust these vars to match your layout offsets.
    // If your footer is fixed height, set --ci-footer-h accordingly.
    "h-[calc(100vh-var(--ci-breadcrumb-offset,120px)-var(--ci-footer-h,64px))]";

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="px-4">
        {/* Top bar (inside the container of the two panels) */}
        <div className={`flex flex-col gap-3 ${containerHeightClass}`}>
          <div className="bg-background flex items-center justify-between rounded-xl border p-3">
            <div className="min-w-0">
              <div className="text-base font-semibold">Seeder</div>
              <div className="text-muted-foreground text-sm">
                Select mock datasets and seed/clear DynamoDB-backed tables.
              </div>
            </div>

            <div className="flex shrink-0 gap-2">
              <button
                className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50"
                disabled={isBusy || selectedItems.length === 0}
                onClick={() => run("clear")}
                title="Clear seeded data for checked items"
              >
                Clear
              </button>

              <button
                className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm disabled:opacity-50"
                disabled={isBusy || selectedItems.length === 0}
                onClick={() => run("seed")}
                title="Seed mock data for checked items"
              >
                Seed
              </button>
            </div>
          </div>

          {/* Two panels */}
          <div className="grid min-h-0 flex-1 grid-cols-12 gap-3">
            {/* Left (narrow) */}
            <div className="bg-background col-span-12 flex min-h-0 flex-col rounded-xl border md:col-span-4 lg:col-span-3">
              <div className="shrink-0 border-b p-3">
                <div className="text-sm font-semibold">Seed Items</div>
                <div className="text-muted-foreground text-xs">
                  Check what you want to seed/clear
                </div>
              </div>

              {/* IMPORTANT: flex-1 + min-h-0 + overflow-auto */}
              <div className="min-h-0 flex-1 overflow-auto p-2">
                <ul className="space-y-1">
                  {SEED_ITEMS.map((item) => (
                    <li key={item.key}>
                      <label className="hover:bg-muted/50 flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4"
                          checked={checked[item.key]}
                          onChange={(e) =>
                            setChecked((prev) => ({
                              ...prev,
                              [item.key]: e.target.checked,
                            }))
                          }
                        />
                        <span className="min-w-0">
                          <div className="text-sm font-medium">
                            {item.label}
                          </div>
                          {item.description ? (
                            <div className="text-muted-foreground text-xs">
                              {item.description}
                            </div>
                          ) : null}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right (wide) */}
            <div className="bg-background col-span-12 flex min-h-0 flex-col rounded-xl border md:col-span-8 lg:col-span-9">
              <div className="shrink-0 border-b p-3">
                <div className="text-sm font-semibold">Activity</div>
                <div className="text-muted-foreground text-xs">
                  Latest events first
                </div>
              </div>

              {/* IMPORTANT: flex-1 + min-h-0 + overflow-auto */}
              <div className="min-h-0 flex-1 overflow-auto">
                {log.length === 0 ? (
                  <div className="text-muted-foreground text-sm">
                    No activity yet.
                  </div>
                ) : (
                  <div className="h-full w-full overflow-hidden">
                    <div className="bg-background text-foreground h-full w-full font-mono text-sm dark:bg-black dark:text-white">
                      {/* Terminal header */}
                      {/* <div className='flex items-center justify-between border-b px-3 py-2 dark:border-white/10'>
                        <div className='flex items-center gap-2'>
                          <span className='inline-block h-2 w-2 rounded-full bg-red-500/80' />
                          <span className='inline-block h-2 w-2 rounded-full bg-yellow-500/80' />
                          <span className='inline-block h-2 w-2 rounded-full bg-green-500/80' />
                          <span className='text-xs opacity-70'>ci-seeder</span>
                        </div>
                        <span className='text-xs opacity-60'>latest first</span>
                      </div> */}

                      {/* Terminal stream */}
                      <div className="h-[calc(100%-40px)] overflow-auto overscroll-contain p-3">
                        <ul className="space-y-1">
                          {log.map((l, idx) => (
                            <li key={`${l.ts}-${idx}`} className="leading-none">
                              <div className="flex min-w-0 items-center gap-2">
                                {/* Time */}
                                <span className="shrink-0 text-xs leading-none tabular-nums opacity-50">
                                  {new Date(l.ts).toLocaleTimeString(
                                    undefined,
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      second: "2-digit",
                                    },
                                  )}
                                </span>

                                {/* Prompt right after time */}
                                <span className="shrink-0 text-xs leading-none opacity-50">
                                  $
                                </span>

                                {/* Tone column: dynamic width in "ch" so message starts at same column */}
                                <span
                                  className={`shrink-0 text-xs leading-none tracking-wide uppercase tabular-nums ${toneClass(
                                    l.tone,
                                  )}`}
                                  style={{ width: `${toneColCh}ch` }}
                                >
                                  {l.tone ?? "info"}
                                </span>

                                {/* Message (smaller font) */}
                                <span className="min-w-0 text-xs leading-none break-words opacity-90">
                                  {l.text}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </NextIntlClientProvider>
  );
}

function toneClass(tone: LogLine["tone"]) {
  switch (tone) {
    case "success":
      return "text-green-700 dark:text-green-400";
    case "warning":
      return "text-amber-700 dark:text-amber-400";
    case "error":
      return "text-red-700 dark:text-red-400";
    default:
      return "text-blue-700 dark:text-blue-400";
  }
}
