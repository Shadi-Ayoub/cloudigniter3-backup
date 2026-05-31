import { ciStartTraceServer } from "../../server";
// import {
//   CiHeaderLogo,
//   CiMainHeaderNavigationBox,
//   CiMainHeaderUserBox,
// } from "@ci-next/ui";
import type { CiNextPageConfig } from "../../types";
import { CiPageWrapper } from "../../ui/server";
import { CiHeader } from "./header/CiHeader";
import { CiContainer } from "./container/CiContainer";
import { CiCopyright, CiFooter } from "./footer";

interface LayoutProps {
  config: CiNextPageConfig;
  protect?: boolean;
  children: React.ReactNode;
}

export default function CiLayout({
  config,
  protect = true,
  children,
}: LayoutProps) {
  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = ciStartTraceServer(
    config.ciConfig.dev.traceLog,
    { source: "server", prettyWave: true },
    { name: "Layout" },
  );

  logger.log({
    type: "component",
    name: "Layout",
    scope: "layout",
    event: `Rendering the <Layout> component`,
  });
  //////////////////////////////////////////////////////////////////////////////////////////////////
  return (
    <CiPageWrapper config={config} protect={protect}>
      <main className="ci-login-main">
        <CiHeader config={config}>
          {null}
          {/* <MainHeaderNavigationBox config={config} />
          <HeaderLogo config={config} />
          <MainHeaderUserBox config={config} /> */}
        </CiHeader>
        <CiContainer config={config}>{children}</CiContainer>
        <CiFooter
          // checkList={{
          //   amplifyOutputs: config.ciConfig.amplifyOutputs,
          //   settings: config.settings,
          //   status: config.status,
          // }}
          config={config}
        >
          <CiCopyright />
        </CiFooter>
      </main>
    </CiPageWrapper>
  );
}
