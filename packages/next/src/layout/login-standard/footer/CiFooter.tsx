import React from "react";
// import { useTranslations } from 'next-intl';

import { ciStartTraceServer } from "@cloudigniter/core/server";
import type { CiCoreConfig } from "@cloudigniter/core/types";

interface FooterInterface {
  config: CiCoreConfig;
  // checkList: SystemStatusCheckList;
  children: React.ReactNode;
}

export const CiFooter = ({ config, children }: FooterInterface) => {
  // const t = useTranslations('mainFooter');

  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = ciStartTraceServer(
    config.dev.traceLog,
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
