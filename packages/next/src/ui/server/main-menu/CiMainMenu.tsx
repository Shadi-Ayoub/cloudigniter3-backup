import { Menu } from "lucide-react";
import type { CiMainMenuItem } from "@cloudigniter/core/types";
import { CiNavigationMenu } from "@ci-next/ui/client";

interface MenuButtonInterface {
  config: CiMainMenuItem[];
}
export const CiMainMenu = ({ config }: MenuButtonInterface) => {
  return (
    <CiNavigationMenu
      menu={config}
      trigger={
        <button className="ci-main-menu-trigger">
          <Menu className="ci-main-menu-icon" />
        </button>
      }
    />
  );
};
