import type { ReactNode } from "react";
import type { CiBreadcrumbItem } from "./CiBreadcrumbItem";
export type CiPageSetup = {
    id?: string;
    title?: string;
    subtitle?: string;
    icon?: ReactNode;
    actions?: ReactNode;
    /** If false, hides the page header. Defaults to true. */
    showPageHeader?: boolean;
    /** Locale inferred or supplied by the framework layer. */
    locale?: string;
    /** Language direction inferred or supplied by the framework layer. */
    direction?: "ltr" | "rtl";
    /** Breadcrumb configuration. */
    showBreadcrumbs?: boolean;
    breadcrumbs?: CiBreadcrumbItem[];
    includeHomeInBreadcrumbs?: boolean;
    homeHref?: string;
    homeI18nKey?: string;
    /** Whether the surrounding application layout has a primary header. */
    layoutHasHeader?: boolean;
    /** Whether the surrounding application layout has a footer. */
    layoutHasFooter?: boolean;
};
//# sourceMappingURL=CiPageSetup.d.ts.map