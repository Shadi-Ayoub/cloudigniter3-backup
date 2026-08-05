"use client";

import { useCallback, type ComponentProps } from "react";
import { useRouter } from "next/navigation";
import {
  CiNavigateWithLoader,
  useCiPageLoaderStore,
} from "@cloudigniter/ui/client";

type CiNavigateWithLoaderProps = ComponentProps<
  typeof CiNavigateWithLoader
>;

export type CiNextNavigateWithLoaderProps = Omit<
  CiNavigateWithLoaderProps,
  "navigate" | "refreshRoute"
>;

export type CiNextNavigationWithLoaderAdapter = Pick<
  CiNavigateWithLoaderProps,
  "navigate" | "onNavigateStart" | "refreshRoute"
>;

/**
 * Connects provider-neutral CloudIgniter navigation to the Next.js router and
 * shared page-loader store.
 */
export function useCiNextNavigationWithLoader(
  onNavigateStart?: (href: string) => void,
): CiNextNavigationWithLoaderAdapter {
  const router = useRouter();
  const setLoading = useCiPageLoaderStore((state) => state.setLoading);

  const handleNavigateStart = useCallback(
    (href: string) => {
      setLoading(true);
      onNavigateStart?.(href);
    },
    [onNavigateStart, setLoading],
  );

  const navigate = useCallback(
    (href: string) => {
      router.push(href);
    },
    [router],
  );

  const refreshRoute = useCallback(() => {
    router.refresh();
  }, [router]);

  return {
    navigate,
    onNavigateStart: handleNavigateStart,
    refreshRoute,
  };
}

/** Next.js adapter for {@link CiNavigateWithLoader}. */
export function CiNextNavigateWithLoader({
  onNavigateStart,
  ...props
}: CiNextNavigateWithLoaderProps) {
  const navigation = useCiNextNavigationWithLoader(onNavigateStart);

  return <CiNavigateWithLoader {...props} {...navigation} />;
}
