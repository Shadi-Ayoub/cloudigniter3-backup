import { Fragment, type ReactNode } from "react";
import { ciCapitalizeFirstLetter } from "@cloudigniter/core/lib";
import { CiDashboardCard } from "@ci-ui/client";

import type { CiDashboardCardProps } from "@ci-ui/types";

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

  /** Overrides dashboard-card rendering for framework-specific navigation. */
  renderCard?: (
    card: CiDashboardCardProps,
    index: number,
  ) => ReactNode;
};

export function CiDashboardPage({
  setup,
  translate,
  capitalizeLabels = true,
  renderCard,
}: CiDashboardPageProps) {
  return (
    <CiDashboardGrid>
      {setup.map((card, index) => {
        const translatedLabel = translate ? translate(card.label) : card.label;

        const label = capitalizeLabels
          ? ciCapitalizeFirstLetter(translatedLabel)
          : translatedLabel;

        const resolvedCard = { ...card, label };
        const key = card.route ?? card.id ?? index;

        return renderCard ? (
          <Fragment key={key}>{renderCard(resolvedCard, index)}</Fragment>
        ) : (
          <CiDashboardCard key={key} {...resolvedCard} />
        );
      })}
    </CiDashboardGrid>
  );
}
