import React from "react";
import { ciStartTraceServer } from "@cloudigniter/core/server";
import type { CiNextContext } from "@ci-next/types";

interface ContentProps {
  context: CiNextContext;
  children: React.ReactNode;
}

export const CiContainer: React.FC<ContentProps> = ({ context, children }) => {
  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = ciStartTraceServer(
    context.config.appCoreConfig.dev.traceLog,
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
