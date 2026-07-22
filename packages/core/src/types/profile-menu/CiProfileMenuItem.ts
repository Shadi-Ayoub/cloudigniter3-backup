import type { ReactNode } from "react";

export type CiProfileMenuItem = {
  id?: string;
  label: ReactNode;
  shortcut?: ReactNode;
  disabled?: boolean;
  hidden?: boolean;
  onSelect?: () => void | Promise<void>;
};
