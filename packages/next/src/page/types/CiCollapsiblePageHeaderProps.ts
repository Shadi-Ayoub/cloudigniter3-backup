import { type ReactNode, type RefObject } from "react";
import type { CiResolvedPageConfig } from "./CiResolvedPageConfig";

export interface CiCollapsiblePageHeaderProps {
  config?: CiResolvedPageConfig;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  scrollContainerRef: RefObject<HTMLElement | null>;
  threshold?: number; // px before collapsing
}
