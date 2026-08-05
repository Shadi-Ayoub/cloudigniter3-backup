"use client";

import { usePathname } from "next/navigation";
import { CiMenuItem } from "@cloudigniter/ui/client";
import type { CiMenuItemProps } from "@cloudigniter/core/types";
import { useCiNextNavigationWithLoader } from "@ci-next/client/navigation";

export type CiNextMenuItemProps = Omit<
  CiMenuItemProps,
  "pathname" | "navigate" | "onNavigateStart"
>;

export function CiNextMenuItem(props: CiNextMenuItemProps) {
  const pathname = usePathname();
  const { navigate, onNavigateStart } = useCiNextNavigationWithLoader();

  return (
    <CiMenuItem
      {...props}
      pathname={pathname}
      navigate={navigate}
      onNavigateStart={onNavigateStart}
    />
  );
}
