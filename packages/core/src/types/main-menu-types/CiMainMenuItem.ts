import type { CiMainMenuTarget } from "./CiMainMenuTarget";

export type CiMainMenuItem = {
  id: string;
  label: string;
  url?: string;
  icon?: string;
  hidden?: boolean;
  target?: CiMainMenuTarget;
  subMenu?: Record<string, CiMainMenuItem>;
};
