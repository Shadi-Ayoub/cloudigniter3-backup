import React from "react";

import { ciStartTraceServer } from "../../../server";
import type { CiNextPageConfig } from "../../../types";

interface HeaderInterface {
  config: CiNextPageConfig;
  children: React.ReactNode;
}

export const CiHeader = ({ config, children }: HeaderInterface) => {
  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = ciStartTraceServer(
    config.ciConfig.dev.traceLog,
    { source: "server", prettyWave: true },
    { name: "Header" },
  );

  logger.log({
    type: "component",
    name: "Header",
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
