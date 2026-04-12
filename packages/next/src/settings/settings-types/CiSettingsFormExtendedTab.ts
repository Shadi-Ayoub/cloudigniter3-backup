import type { ComponentType, ReactNode } from "react";

import type { CiLocaleDirection } from "@/.";

export interface ExtendedTabComponentProps {
  direction?: CiLocaleDirection;
}

export type CiSettingsFormExtendedTab = {
  id: string;
  label: string;
  Component: ComponentType<ExtendedTabComponentProps>;
  description?: string;
  icon?: ReactNode;
};
