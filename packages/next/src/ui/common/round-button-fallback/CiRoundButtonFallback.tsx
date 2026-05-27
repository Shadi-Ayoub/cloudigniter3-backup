import { Spin } from "antd";

// import type {
//   CiStartTraceInit,
//   CiStartTraceResult,
// } from "@cloudigniter/core/types";
// import type { CiNextPageConfig } from "@ci-next/types";

// interface CiRoundButtonFallbackProps {
//   config: CiNextPageConfig;
//   ciStartTrace?: (
//     baseConfig?: Record<string, unknown>,
//     overrides?: Record<string, unknown>,
//     init?: CiStartTraceInit,
//   ) => CiStartTraceResult;
// }

export const CiRoundButtonFallback = () => {
  // ///////////////////////////////////////////////////////////////////////////////////////// Log trace
  // const trace = ciStartTrace?.(
  //   config.ciConfig.traceLog,
  //   { prettyWave: true },
  //   { name: "<RoundButtonFallback>" },
  // );

  // trace?.logger.log({
  //   type: "component",
  //   name: "RoundButtonFallback",
  //   scope: "ui",
  //   event: "Rendering the <RoundButtonFallback> component",
  // });
  // //////////////////////////////////////////////////////////////////////////////////////////////////

  return (
    <div className="round-button-fallback">
      <Spin />
    </div>
  );
};
