import type { CiDashboardCardConfig, CiDashboardCardViewModel } from "@ci-core/client";
/**
 * Resolve dashboard card configuration into render-ready view models.
 */
export declare function ciResolveDashboardCardViewModels(cards: CiDashboardCardConfig[], options?: {
    translate?: (label: string) => string;
    capitalizeLabel?: boolean;
}): CiDashboardCardViewModel[];
//# sourceMappingURL=ci-resolve-dashboard-card-view-models.d.ts.map