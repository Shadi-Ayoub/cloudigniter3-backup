"use client";

import { useCallback, useEffect, useState } from "react";
import { ciIsGraphqlResponse, ciSafeToString } from "@cloudigniter/core/lib";
import { ciCall, ciGetEnvMode } from "@cloudigniter/core/client";
import {
  ciPrintToConsole,
  ciNormalizeClientThrownError,
  ciNotify,
} from "@cloudigniter/core/client";
import {
  type CiTenant,
  type CiRequest,
  type CiResponse,
} from "@cloudigniter/core/types";

import type {
  LoadTenantsInput,
  LoadTenantsOkBody,
  LoadTenantsErrorBody,
} from "./types";

function isLoadTenantsOkBody(x: unknown): x is LoadTenantsOkBody {
  if (!x || typeof x !== "object") return false;
  const o = x as any;
  return Array.isArray(o.items) && typeof o.count === "number";
}

function getErrMsg(errBody: unknown): string {
  const anyBody = errBody as any;
  return (
    anyBody?.error?.toString?.() ??
    (typeof anyBody?.error === "string" ? anyBody.error : null) ??
    "CiRequest failed."
  );
}

export function useTenantsLoader(
  setLoading: (v: boolean, text?: string) => void,
) {
  const [tenants, setTenants] = useState<CiTenant[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadTenants = useCallback(async () => {
    setLoading(true, "Loading tenants. Please wait...");
    setErrorMsg(null);

    const envMode = ciGetEnvMode();

    const request: CiRequest<LoadTenantsInput> = {
      input: { includeDisabled: false },
      envMode,
    };

    try {
      const result = await ciCall<
        LoadTenantsInput,
        CiResponse<LoadTenantsOkBody, LoadTenantsErrorBody>
      >("/dashboard/tenants/list", request);

      if (!result.ok) {
        const errMsg =
          result.message ?? "Unexpected error while loading tenants.";
        setErrorMsg(errMsg);
        ciNotify("error", errMsg);
        return;
      }

      const respUnknown = result.response;

      if (
        !ciIsGraphqlResponse<LoadTenantsOkBody, LoadTenantsErrorBody>(
          respUnknown,
        )
      ) {
        const errMsg = `Unexpected response shape: ${ciSafeToString(
          respUnknown,
        )}`;
        setErrorMsg(errMsg);
        ciNotify("error", errMsg);
        return;
      }

      const statusCode = respUnknown.statusCode ?? 200;

      if (statusCode < 400 && isLoadTenantsOkBody(respUnknown.body)) {
        setTenants(respUnknown.body.items);

        ciPrintToConsole({
          label: "Tenants loaded:",
          message: respUnknown.body as object,
          options: { format: "JSON", messageType: "SUCCESS" },
        });
      } else if (statusCode >= 400) {
        const msg = getErrMsg(respUnknown.body);
        setErrorMsg(msg);
        ciNotify("error", msg);
      } else {
        const msg = `Unexpected OK body shape: ${ciSafeToString(
          respUnknown.body,
        )}`;
        setErrorMsg(msg);
        ciNotify("error", msg);
      }
    } catch (error: unknown) {
      const normalized = ciNormalizeClientThrownError(error);
      const errMsg = `Unexpected error while loading tenants! ${normalized.message}`;
      setErrorMsg(errMsg);
      ciNotify("error", errMsg);

      ciPrintToConsole({
        label: "[TenantsPage] Load tenants error:",
        message: error as string,
        options: { messageType: "ERROR" },
      });
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  useEffect(() => {
    // load on mount
    void loadTenants();
  }, [loadTenants]);

  return { tenants, setTenants, loadTenants, errorMsg };
}
