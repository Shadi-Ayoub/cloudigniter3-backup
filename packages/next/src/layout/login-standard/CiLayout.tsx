import { ciStartTraceServer } from "@cloudigniter/core/server";
// import {
//   CiHeaderLogo,
//   CiMainHeaderNavigationBox,
//   CiMainHeaderUserBox,
// } from "@ci-next/ui";
import type { CiNextContext } from "@ci-next/types";
import { CiPageWrapper } from "@ci-next/server";
import { CiHeader } from "./header/CiHeader";
import { CiContainer } from "./container/CiContainer";
import { CiCopyright, CiFooter } from "./footer";

interface LayoutProps {
  context: CiNextContext;
  protect?: boolean;
  children: React.ReactNode;
}

export default function CiLayout({
  context,
  protect = true,
  children,
}: LayoutProps) {
  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = ciStartTraceServer(
    context.config.appCoreConfig.dev.traceLog,
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
    <CiPageWrapper context={context} protect={protect}>
      <main className="ci-login-main">
        <CiHeader config={context.config.appCoreConfig}>
          {null}
          {/* <MainHeaderNavigationBox config={config} />
          <HeaderLogo config={config} />
          <MainHeaderUserBox config={config} /> */}
        </CiHeader>
        <CiContainer config={context.config.appCoreConfig}>
          {children}
        </CiContainer>
        <CiFooter
          // checkList={{
          //   amplifyOutputs: config.ciConfig.amplifyOutputs,
          //   settings: config.settings,
          //   status: config.status,
          // }}
          config={context.config.appCoreConfig}
        >
          <CiCopyright />
        </CiFooter>
      </main>
    </CiPageWrapper>
  );
}
