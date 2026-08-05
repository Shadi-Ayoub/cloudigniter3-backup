"use client";

import { Menu } from "lucide-react";
import type { CiMainMenuItem } from "@cloudigniter/core/types";

import { CiNextNavigationMenu } from "./CiNextNavigationMenu";

export interface CiNextMainMenuProps {
  config: CiMainMenuItem[];
}

/** Next.js-aware main menu with client navigation and loader integration. */
export function CiNextMainMenu({ config }: CiNextMainMenuProps) {
  return (
    <CiNextNavigationMenu
      menu={config}
      trigger={
        <button className="ci-main-menu-trigger">
          <Menu className="ci-main-menu-icon" />
        </button>
      }
    />
  );
}
