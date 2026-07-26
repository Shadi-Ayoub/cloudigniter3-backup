import React from "react";
import { useTranslations } from "next-intl";

import { ciStartTraceServer } from "@cloudigniter/core/server";
import { ciCapitalizeFirstLetter } from "@cloudigniter/core/lib";
import type { CiNextContext } from "@ci-next/types";

interface FooterProps {
  context: CiNextContext;
  children: React.ReactNode;
}

export const CiFooter: React.FC<FooterProps> = ({ context, children }) => {
  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = ciStartTraceServer(
    context.config.appCoreConfig.dev.traceLog,
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
        <span className="ci-main-footer-env-text">{t(process.env.NODE_ENV)}</span>
      </div>
    </footer>
  );
};
