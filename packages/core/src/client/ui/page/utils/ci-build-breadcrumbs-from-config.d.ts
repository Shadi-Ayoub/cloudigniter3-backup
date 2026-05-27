import { type ReactNode } from "react";
import type { CiBreadcrumbItem, CiPageSetup } from "@ci-core/client";
export type CiBuildBreadcrumbsFromConfigInput = Partial<Pick<CiPageSetup, "breadcrumbs" | "homeHref" | "homeI18nKey" | "includeHomeInBreadcrumbs" | "title">> & {
    homeIcon?: ReactNode;
};
export declare function ciBuildBreadcrumbsFromConfig(config: CiBuildBreadcrumbsFromConfigInput): CiBreadcrumbItem[];
/**
 *
 * let Next pass the icon:
 * homeIcon?: ReactNode;
 *
 * Then in next:
 *
 * import { Home } from "lucide-react";
 * const breadcrumbItems = ciBuildBreadcrumbsFromConfig({
 *  ...setup,
 *  homeIcon: <Home className="size-4" />,
 * });
 *
 */
//# sourceMappingURL=ci-build-breadcrumbs-from-config.d.ts.map