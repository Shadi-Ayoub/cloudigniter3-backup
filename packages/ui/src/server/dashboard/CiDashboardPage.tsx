import { ciCapitalizeFirstLetter } from "@cloudigniter/core/lib";

import type { CiDashboardCardProps } from "@ci-ui/types";

import { CiDashboardCard } from "./CiDashboardCard";
import { CiDashboardGrid } from "./CiDashboardGrid";

export type CiDashboardTranslate = (
  key: string,
  values?: Record<string, unknown>,
) => string;

export type CiDashboardPageProps = {
  setup: CiDashboardCardProps[];

  /**
   * Resolves a dashboard message key into its translated value.
   *
   * When omitted, the original label is displayed.
   */
  translate?: CiDashboardTranslate;

  /**
   * Controls whether the translated label should be capitalized.
   */
  capitalizeLabels?: boolean;
};

export function CiDashboardPage({
  setup,
  translate,
  capitalizeLabels = true,
}: CiDashboardPageProps) {
  return (
    <CiDashboardGrid>
      {setup.map((card, index) => {
        const translatedLabel = translate ? translate(card.label) : card.label;

        const label = capitalizeLabels
          ? ciCapitalizeFirstLetter(translatedLabel)
          : translatedLabel;

        return (
          <CiDashboardCard
            key={card.route ?? card.id ?? index}
            id={card.id}
            icon={card.icon}
            route={card.route}
            label={label}
          />
        );
      })}
    </CiDashboardGrid>
  );
}
