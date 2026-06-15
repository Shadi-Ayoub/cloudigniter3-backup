import React from "react";

import { CiMainHeaderUserBox, CiPageWrapper } from "../../ui/server";
import { CiDashboardHeaderButton } from "../../ui/client";
import { ciStartTraceServer } from "../../server";
import type { CiNextPageConfig } from "../../types";

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
    config.ciConfig.dev.traceLog,
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
        <CiDashboardHeaderButton traceConfig={config.ciConfig.dev.traceLog} />
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
