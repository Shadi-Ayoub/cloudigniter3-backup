import React from "react";
import { CiDashboardHeaderButton } from "@cloudigniter/ui/client";

import { CiPageWrapper } from "@ci-next/server";
import { CiMainHeaderUserBox } from "@ci-next/ui/server";
import { ciStartTraceServer } from "@cloudigniter/core/server";
import type { CiNextContext } from "@ci-next/types";

import { CiHeader } from "./header";
import { CiContainer } from "./container";
import { CiCopyright, CiFooter } from "./footer";

interface CiLayoutProps {
  context: CiNextContext;
  protect: boolean;
  children: React.ReactNode;
}

const CiLayout = ({ context, protect, children }: CiLayoutProps) => {
  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = ciStartTraceServer(
    context.config.appCoreConfig.dev.traceLog,
    { source: "server", prettyWave: true },
    { name: "<Layout>" },
  );

  logger.log({
    scope: "layout",
    event: `Rendering the <Layout> component`,
  });
  //////////////////////////////////////////////////////////////////////////////////////////////////

  return (
    <CiPageWrapper context={context} protect={protect}>
      <CiHeader context={context}>
        <CiDashboardHeaderButton traceConfig={context.config.appCoreConfig.dev.traceLog} />
        <div></div>
        <CiMainHeaderUserBox context={context} />
      </CiHeader>
      <CiContainer context={context}>{children}</CiContainer>
      <CiFooter context={context}>
        <CiCopyright config={context.config} />
      </CiFooter>
    </CiPageWrapper>
  );
};

export default CiLayout;
