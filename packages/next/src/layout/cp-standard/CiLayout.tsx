import { ciStartTraceServer } from "@ci-next/server";
import { type CiSystemStatus } from "@cloudigniter/core/types";
import type { CiNextPageConfig } from "@ci-next/types";
import { CiPageWrapper } from "@ci-next/wrapper";
import {
  CiMainHeaderNavigationBox,
  CiMainHeaderUserBox,
} from "@ci-next/ui/server";
import { CiHeaderLogo } from "@ci-next/ui/client";
import { CiHeader } from "./header/CiHeader";
import { CiContainer } from "./container/CiContainer";
import { CiCopyright, CiFooter } from "./footer";

interface LayoutProps {
  config: CiNextPageConfig;
  status?: CiSystemStatus;
  protect?: boolean;
  children: React.ReactNode;
}

export default function CiLayout({
  config,
  // status,
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
      <main className="ci-main">
        <CiHeader config={config}>
          <CiMainHeaderNavigationBox config={config} />
          <CiHeaderLogo config={config} />
          <CiMainHeaderUserBox config={config} />
        </CiHeader>
        <CiContainer config={config}>{children}</CiContainer>
        <CiFooter
          checkList={{
            // amplifyOutputs: config.providers?.aws?.amplifyOutputs,
            settings: config.settings,
            // status: status,
          }}
          config={config}
        >
          <CiCopyright />
        </CiFooter>
      </main>
    </CiPageWrapper>
  );
}
