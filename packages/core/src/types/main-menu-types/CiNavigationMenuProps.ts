import { type ReactNode } from "react";
import type { CiMainMenuItem } from "./CiMainMenuItem";

export interface CiNavigationMenuProps {
  menu: CiMainMenuItem[];
  trigger: ReactNode;

  /**
   * Current application pathname used to determine whether navigation
   * targets a different route.
   */
  pathname?: string;

  /**
   * Performs client-side navigation.
   *
   * When omitted, menu items use native anchor navigation.
   */
  navigate?: (href: string) => void | Promise<void>;

  /**
   * Called immediately before client-side navigation begins.
   *
   * This can be used to display a page loader.
   */
  onNavigateStart?: (href: string) => void;

  /**
   * Optional prefix used when persisting submenu expansion state.
   */
  storageKeyPrefix?: string;
}
