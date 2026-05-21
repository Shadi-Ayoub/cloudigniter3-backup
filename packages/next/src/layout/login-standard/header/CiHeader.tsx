import React from "react";

import { ciStartTrace } from "@cloudigniter/core";
import type { CiNextPageConfig } from "@/page";

interface HeaderInterface {
  config: CiNextPageConfig;
  children: React.ReactNode;
}

export const CiHeader = ({ config, children }: HeaderInterface) => {
  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = ciStartTrace(
    config.ciConfig.traceLog,
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
