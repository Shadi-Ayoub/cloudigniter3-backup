"use client";

import { ciStartTraceClient } from "@ci-core/client";
import { CiAboutBorderBeamView } from "./CiAboutBorderBeamView";
import type { CiAboutBorderBeamProps } from "@ci-core/client";

export function CiAboutBorderBeam({
  traceConfig,
  title,
  primaryText,
  secondaryText,
  options,
}: CiAboutBorderBeamProps) {
  const { logger } = ciStartTraceClient(
    traceConfig,
    { source: "server", prettyWave: true },
    { name: "<CiAboutBorderBeam>" },
  );

  logger.log({
    scope: "ui",
    event: "Rendering CiAboutBorderBeam",
  });

  return (
    <CiAboutBorderBeamView
      title={title}
      primaryText={primaryText}
      secondaryText={secondaryText}
      options={options}
    />
  );
}
