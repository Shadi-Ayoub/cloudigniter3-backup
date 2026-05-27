import type { CSSProperties, ReactNode, RefObject } from "react";
export interface CiPageShellProps {
    children: ReactNode;
    scrollContainerRef?: RefObject<HTMLDivElement | null>;
    isLoginPage?: boolean;
    showBreadcrumbs?: boolean;
    layoutHasHeader?: boolean;
    layoutHasFooter?: boolean;
    breadcrumbsSlot?: ReactNode;
    headerSlot?: ReactNode;
    loaderSlot?: ReactNode;
    className?: string;
    innerClassName?: string;
    style?: CSSProperties;
}
//# sourceMappingURL=CiPageShellProps.d.ts.map