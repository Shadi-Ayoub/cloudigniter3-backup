import { Menu } from "lucide-react";
import type { CiMainMenuItem } from "./types";
import { CiNavigationMenu } from "./CiNavigationMenu";

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
