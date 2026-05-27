import { ciCapitalizeFirstLetter } from "@ci-core/lib";
import type {
  CiDashboardCardConfig,
  CiDashboardCardViewModel,
} from "@ci-core/client";
import { ciResolveDashboardIcon } from "./ci-resolve-dashboard-icon";

/**
 * Resolve dashboard card configuration into render-ready view models.
 */
export function ciResolveDashboardCardViewModels(
  cards: CiDashboardCardConfig[],
  options?: {
    translate?: (label: string) => string;
    capitalizeLabel?: boolean;
  },
): CiDashboardCardViewModel[] {
  const ciTranslate = options?.translate;
  const ciCapitalize = options?.capitalizeLabel ?? true;

  return cards.map((card) => {
    const ciResolvedLabel = ciTranslate ? ciTranslate(card.label) : card.label;

    return {
      id: card.id,
      route: card.route,
      icon: ciResolveDashboardIcon(card.icon),
      className: card.className,
      contentClassName: card.contentClassName,
      iconClassName: card.iconClassName,
      labelClassName: card.labelClassName,
      refresh: card.refresh,
      removeFocus: card.removeFocus,
      externalTarget: card.externalTarget,
      label: ciCapitalize
        ? ciCapitalizeFirstLetter(ciResolvedLabel)
        : ciResolvedLabel,
    };
  });
}
