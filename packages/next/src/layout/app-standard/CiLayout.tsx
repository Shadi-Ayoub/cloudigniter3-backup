import React from "react";
import { CiDashboardHeaderButton } from "@cloudigniter/ui/client";

import { CiPageWrapper } from "@ci-next/server";
import { CiMainHeaderUserBox } from "@ci-next/ui/server";
import { ciStartTraceServer } from "@cloudigniter/core/server";
import type { CiNextPageConfig } from "@ci-next/types";

import { CiHeader } from "./header";
import { CiContainer } from "./container";
import { CiCopyright, CiFooter } from "./footer";

interface CiLayoutProps {
  config: CiNextPageConfig;
  protect: boolean;
  children: React.ReactNode;
}

const CiLayout = ({ config, protect, children }: CiLayoutProps) => {
  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = ciStartTraceServer(
    config.coreConfig.dev.traceLog,
    { source: "server", prettyWave: true },
    { name: "<Layout>" },
  );

  logger.log({
    scope: "layout",
    event: `Rendering the <Layout> component`,
  });
  //////////////////////////////////////////////////////////////////////////////////////////////////

  return (
    <CiPageWrapper config={config} protect={protect}>
      <CiHeader config={config}>
        <CiDashboardHeaderButton traceConfig={config.coreConfig.dev.traceLog} />
        <div></div>
        <CiMainHeaderUserBox config={config} />
      </CiHeader>
      <CiContainer config={config}>{children}</CiContainer>
      <CiFooter config={config}>
        <CiCopyright config={config} />
      </CiFooter>
    </CiPageWrapper>
  );
};

export default CiLayout;
