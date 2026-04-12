import { type ReactNode } from "react";
import { type AbstractIntlMessages } from "next-intl";
import type { CiBreadcrumbItem } from "./CiBreadcrumbItem";

export type CiPageSetup = {
  id?: string;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode[];
  /** If false, hides the header. Defaults to true. */
  showPageHeader?: boolean;
  locale?: string; // adding inferred locale
  direction?: "ltr" | "rtl"; // adding inferred locale direction
  messages?: AbstractIntlMessages; // adding inferred messages for translation

  /** Breadcrumbs */
  showBreadcrumbs?: boolean; // defaults to true
  breadcrumbs?: CiBreadcrumbItem[]; // per-page definition
  includeHomeInBreadcrumbs?: boolean; // defaults to true
  homeHref?: string; // example '/'
  homeI18nKey?: string; // example dashboard.settings
  layoutHasHeader?: boolean; // example: login page show without having the header and the footer
  layoutHasFooter?: boolean; // example: login page show without having the header and the footer
};
