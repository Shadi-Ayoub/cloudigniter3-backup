import type { ReactNode, RefObject } from "react";

export interface CiCollapsiblePageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  scrollContainerRef: RefObject<HTMLElement | null>;
  threshold?: number;
}
