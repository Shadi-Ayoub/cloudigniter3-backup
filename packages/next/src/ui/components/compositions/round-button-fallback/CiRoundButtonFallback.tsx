import { Spin } from "antd";

import { ciStartTrace } from "@cloudigniter/core";
import type { CiNextPageConfig } from "@/page";

interface RoundButtonFallbackInterface {
  config: CiNextPageConfig;
}

export const CiRoundButtonFallback = ({
  config,
}: RoundButtonFallbackInterface) => {
  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = ciStartTrace(
    config.ciConfig.traceLog,
    { source: "server", prettyWave: true },
    { name: "<RoundButtonFallback>" },
  );

  logger.log({
    scope: "ui",
    event: `Rendering the <RoundButtonFallback> component`,
  });
  //////////////////////////////////////////////////////////////////////////////////////////////////

  return (
    <div className="round-button-fallback">
      <Spin />
    </div>
  );
};
