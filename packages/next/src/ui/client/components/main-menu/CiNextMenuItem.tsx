"use client";

import { usePathname, useRouter } from "next/navigation";
import { CiMenuItem, useCiPageLoaderStore } from "@cloudigniter/ui/client";
import type { CiMenuItemProps } from "@cloudigniter/core/types";

export type CiNextMenuItemProps = Omit<
  CiMenuItemProps,
  "pathname" | "navigate" | "onNavigateStart"
>;

export function CiNextMenuItem(props: CiNextMenuItemProps) {
  const pathname = usePathname();
  const router = useRouter();

  const setLoading = useCiPageLoaderStore((state) => state.setLoading);

  return (
    <CiMenuItem
      {...props}
      pathname={pathname}
      navigate={(href) => router.push(href)}
      onNavigateStart={() => setLoading(true)}
    />
  );
}
