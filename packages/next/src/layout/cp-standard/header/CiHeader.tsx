import React from "react";

import { ciStartTraceServer } from "@cloudigniter/core/server";
import type { CiNextContext } from "@ci-next/types";

interface HeaderInterface {
  context: CiNextContext;
  children: React.ReactNode;
}

export const CiHeader = ({ context, children }: HeaderInterface) => {
  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = ciStartTraceServer(
    context.config.appCoreConfig.dev.traceLog,
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
