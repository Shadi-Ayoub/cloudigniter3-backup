"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ciAwsSignOut } from "@cloudigniter/aws";
import { useCiPageLoaderStore } from "@/ui";
import type { CiUseLogoutOptions, CiUseLogoutResult } from "../types";

/**
 * Reusable logout workflow for Next client components.
 */
export function useCiLogout(options?: CiUseLogoutOptions): CiUseLogoutResult {
  const router = useRouter();
  const { setLoading } = useCiPageLoaderStore();

  const [ciIsLoggingOut, setCiIsLoggingOut] = useState(false);
  const [ciLogoutError, setCiLogoutError] = useState<unknown>(null);

  const ciLogout = useCallback(async () => {
    try {
      setCiIsLoggingOut(true);
      setCiLogoutError(null);
      setLoading(true);

      await ciAwsSignOut();
      router.push(options?.redirectTo ?? "/login");
    } catch (error) {
      setCiLogoutError(error);
      setLoading(false);
      setCiIsLoggingOut(false);
      console.error("Failed to sign out.", error);
    }
  }, [options?.redirectTo, router, setLoading]);

  return {
    ciLogout,
    ciIsLoggingOut,
    ciLogoutError,
  };
}
