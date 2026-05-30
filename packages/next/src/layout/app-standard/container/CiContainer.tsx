import React from "react";
import { ciStartTraceServer } from "@ci-next/server";
import type { CiNextPageConfig } from "@ci-next/types";

interface ContentInterface {
  config: CiNextPageConfig;
  children: React.ReactNode;
}

export const CiContainer: React.FC<ContentInterface> = ({
  config,
  children,
}) => {
  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = ciStartTraceServer(
    config.ciConfig.dev.traceLog,
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
