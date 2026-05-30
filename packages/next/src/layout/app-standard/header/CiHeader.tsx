import React from "react";

import { ciStartTraceServer } from "@ci-next/server";
import type { CiNextPageConfig } from "@ci-next/types";

interface HeaderProps {
  config: CiNextPageConfig;
  children: React.ReactNode;
}

export const CiHeader = ({ config, children }: HeaderProps) => {
  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = ciStartTraceServer(
    config.ciConfig.dev.traceLog,
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
