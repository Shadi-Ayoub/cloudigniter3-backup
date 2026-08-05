"use client";

import { usePathname } from "next/navigation";

import { CiNavigationMenu } from "@cloudigniter/ui/client";
import { useCiNextNavigationWithLoader } from "@ci-next/client/navigation";
import { type CiNavigationMenuProps } from "@cloudigniter/core/types";

export type CiNextNavigationMenuProps = Omit<
  CiNavigationMenuProps,
  "pathname" | "navigate" | "onNavigateStart"
>;

export function CiNextNavigationMenu(props: CiNextNavigationMenuProps) {
  const pathname = usePathname();
  const { navigate, onNavigateStart } = useCiNextNavigationWithLoader();

  return (
    <CiNavigationMenu
      {...props}
      pathname={pathname}
      navigate={navigate}
      onNavigateStart={onNavigateStart}
    />
  );
}
