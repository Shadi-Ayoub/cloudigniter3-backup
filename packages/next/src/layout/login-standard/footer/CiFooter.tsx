import React from "react";
// import { useTranslations } from 'next-intl';

import { ciStartTrace } from "@cloudigniter/core";
import type { CiNextPageConfig } from "@/page";

interface FooterInterface {
  config: CiNextPageConfig;
  // checkList: SystemStatusCheckList;
  children: React.ReactNode;
}

export const CiFooter = ({ config, children }: FooterInterface) => {
  // const t = useTranslations('mainFooter');

  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = ciStartTrace(
    config.ciConfig.traceLog,
    { source: "server", prettyWave: true },
    { name: "<Footer>" },
  );

  logger.log({
    scope: "layout",
    event: `Rendering the <Footer> component`,
  });
  //////////////////////////////////////////////////////////////////////////////////////////////////

  return (
    <footer className="ci-main-login-footer">
      <div style={{ textAlign: "center" }}>
        <span>{children}</span>
      </div>
    </footer>
  );
};
