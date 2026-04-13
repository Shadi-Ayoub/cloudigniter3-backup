import React from "react";

import { ciStartTrace } from "@cloudigniter/core";
import type { CiResolvedPageConfig } from "@/.";

interface HeaderProps {
  config: CiResolvedPageConfig;
  children: React.ReactNode;
}

export const Header = ({ config, children }: HeaderProps) => {
  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = ciStartTrace(
    config.ciConfig.traceLog,
    { source: "server", prettyWave: true },
    { name: "<Header>" },
  );

  logger.log({
    scope: "layout",
    event: `Rendering the <Header> component`,
  });
  //////////////////////////////////////////////////////////////////////////////////////////////////
  return (
    <header dir="ltr" className="ci-main-header">
      {children}
    </header>
  );
};
