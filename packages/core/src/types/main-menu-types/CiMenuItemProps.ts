import type { CiMainMenuItem } from "./CiMainMenuItem";

export type CiMenuItemProps = {
  item: CiMainMenuItem;

  /**
   * Current application pathname used to identify the active menu item.
   */
  pathname?: string;

  /**
   * Closes the containing menu.
   */
  closeMenu: (newRoute?: string) => void;

  /**
   * Performs client-side navigation.
   *
   * When omitted, internal routes use normal browser navigation.
   */
  navigate?: (href: string) => void | Promise<void>;

  /**
   * Called immediately before internal client-side navigation.
   *
   * This can be used to display a page loader.
   */
  onNavigateStart?: (href: string) => void;

  /**
   * Prefix used for persisted submenu expansion state.
   */
  storageKeyPrefix?: string;
};
