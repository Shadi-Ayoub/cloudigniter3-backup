import React from "react";
import { useTranslations } from "next-intl";

import { ciStartTraceServer } from "@cloudigniter/core/server";
import { ciCapitalizeFirstLetter } from "@cloudigniter/core/lib";
import type { CiNextPageConfig } from "@ci-next/types";

interface FooterProps {
  config: CiNextPageConfig;
  children: React.ReactNode;
}

export const CiFooter: React.FC<FooterProps> = ({ config, children }) => {
  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = ciStartTraceServer(
    config.ciConfig.traceLog,
    { source: "server", prettyWave: true },
    { name: "<Footer>" },
  );

  logger.log({
    scope: "layout",
    event: `Rendering the <Footer> component`,
  });
  //////////////////////////////////////////////////////////////////////////////////////////////////

  const t = useTranslations("mainFooter");

  return (
    <footer className="ci-main-footer">
      <div className="ci-main-footer-left">
        <span>Left Column</span>
      </div>

      <div className="ci-main-footer-center">
        <span>{children}</span>
      </div>

      <div className="ci-main-footer-right">
        <span>{ciCapitalizeFirstLetter(t("environment"))}:</span>&nbsp;
        <span className="ci-main-footer-env-text">
          {t(process.env.NODE_ENV)}
        </span>
      </div>
    </footer>
  );
};
