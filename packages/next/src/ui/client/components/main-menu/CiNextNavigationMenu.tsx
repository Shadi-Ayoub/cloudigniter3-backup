"use client";

import { usePathname, useRouter } from "next/navigation";

import {
  CiNavigationMenu,
  useCiPageLoaderStore,
} from "@cloudigniter/ui/client";
import { type CiNavigationMenuProps } from "@cloudigniter/core/types";

export type CiNextNavigationMenuProps = Omit<
  CiNavigationMenuProps,
  "pathname" | "navigate" | "onNavigateStart"
>;

export function CiNextNavigationMenu(props: CiNextNavigationMenuProps) {
  const pathname = usePathname();
  const router = useRouter();

  const setLoading = useCiPageLoaderStore((state) => state.setLoading);

  return (
    <CiNavigationMenu
      {...props}
      pathname={pathname}
      navigate={(href) => router.push(href)}
      onNavigateStart={() => setLoading(true)}
    />
  );
}
