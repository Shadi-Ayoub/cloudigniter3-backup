import type { ReactNode } from "react";

/** @deprecated Import `CiNextNavigateWithLoaderProps` from `@cloudigniter/next/client`. */
export type CiNavigateWithLoaderProps = {
  href: string;
  className?: string;
  refresh?: boolean;
  removeFocus?: boolean;
  externalTarget?: "_blank" | "_self" | "_parent" | "_top";
  onNavigateStart?: (href: string) => void;
  children: ReactNode;
};
