// import "@aws-amplify/ui-react/styles.css";
// import "@cloudigniter/next/styles/standard.css";
// import "../custom/authenticator/authenticator.css";

import { ciStartTraceServer } from "@cloudigniter/core/server";
import { getConfig } from "@/kernel/server";

const Kernel = () => {
  const config = getConfig();

  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = ciStartTraceServer(
    config.dev.traceLog,
    { source: "server", prettyWave: true },
    { name: "Kernel: Boot" },
  );

  logger.log({ scope: "kernel", event: "Rendering the <Kernel> component" });
  //////////////////////////////////////////////////////////////////////////////////////////////////

  return null;
};

export default Kernel;
