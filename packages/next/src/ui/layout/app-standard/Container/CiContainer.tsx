import React from "react";

import { ciStartTrace } from "@cloudigniter/core";
import type { CiResolvedPageConfig } from "@/.";

interface ContentInterface {
  config: CiResolvedPageConfig;
  children: React.ReactNode;
}

export const CiContainer: React.FC<ContentInterface> = ({
  config,
  children,
}) => {
  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = ciStartTrace(
    config.ciConfig.traceLog,
    { source: "server", prettyWave: true },
    { name: "<Container>" },
  );

  logger.log({
    scope: "layout",
    event: `Rendering the <Container> component`,
  });
  //////////////////////////////////////////////////////////////////////////////////////////////////

  return <div className="ci-container">{children}</div>;
};
