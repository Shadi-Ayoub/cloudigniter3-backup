import React from "react";

import { CiDashboardHeaderButton, CiMainHeaderUserBox } from "@/ui";
import { CiPageWrapper } from "@/wrapper/server";
import { ciStartTrace } from "@cloudigniter/core";
import type { CiNextPageConfig } from "../../";

import { CiHeader } from "./header";
import { CiContainer } from "./container";
import { CiCopyright, CiFooter } from "./footer";

interface CiLayoutProps {
  config: CiNextPageConfig;
  protect: boolean;
  children: React.ReactNode;
}

const CiLayout: React.FC<CiLayoutProps> = ({
  config,
  protect,
  children,
}: CiLayoutProps) => {
  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = ciStartTrace(
    config.ciConfig.traceLog,
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
        <CiDashboardHeaderButton traceConfig={config.ciConfig.traceLog} />
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
