"use client";

import { ciStartTrace } from "@/dev";
import { CiAboutBorderBeamView } from "./CiAboutBorderBeamView";
import type { CiAboutBorderBeamProps } from "@/client";

export function CiAboutBorderBeam({
  traceConfig,
  title,
  primaryText,
  secondaryText,
  options,
}: CiAboutBorderBeamProps) {
  const { logger } = ciStartTrace(
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
