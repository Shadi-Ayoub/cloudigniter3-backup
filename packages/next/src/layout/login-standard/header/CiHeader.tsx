import React from "react";

import { ciStartTraceServer } from "@cloudigniter/core/server";
import type { CiCoreConfig } from "@cloudigniter/core/types";

interface HeaderInterface {
  config: CiCoreConfig;
  children: React.ReactNode;
}

export const CiHeader = ({ config, children }: HeaderInterface) => {
  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = ciStartTraceServer(
    config.dev.traceLog,
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
    // <header dir='ltr' className='ci-main-header'>
    <header dir="ltr">{children}</header>
  );
};
