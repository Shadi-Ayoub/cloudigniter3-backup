"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "aws-amplify/auth";
import { useCiPageLoaderStore } from "@ci-next/ui/client";
import type { CiUseLogoutOptions, CiUseLogoutResult } from "@ci-next/types";

/**
 * Reusable logout workflow for Next client components.
 */
export function useCiAwsLogout(
  options?: CiUseLogoutOptions,
): CiUseLogoutResult {
  const router = useRouter();
  const { setLoading } = useCiPageLoaderStore();

  const [ciIsLoggingOut, setCiIsLoggingOut] = useState(false);
  const [ciLogoutError, setCiLogoutError] = useState<unknown>(null);

  const ciLogout = useCallback(async () => {
    try {
      setCiIsLoggingOut(true);
      setCiLogoutError(null);
      setLoading(true);

      await signOut();
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
