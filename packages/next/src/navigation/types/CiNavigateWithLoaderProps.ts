import type { ReactNode } from "react";

export type CiNavigateWithLoaderProps = {
  href: string;
  className?: string;
  refresh?: boolean;
  removeFocus?: boolean;
  externalTarget?: "_blank" | "_self";
  children: ReactNode;
};
