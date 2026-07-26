import { ciStartTraceServer } from "@cloudigniter/core/server";
import { type CiSystemStatus } from "@cloudigniter/core/types";
import type { CiNextContext } from "@ci-next/types";
import { CiPageWrapper } from "@ci-next/server";
import { CiMainHeaderNavigationBox, CiMainHeaderUserBox } from "@ci-next/ui/server";
import { CiHeaderLogo } from "@cloudigniter/ui/client";
import { CiHeader } from "./header/CiHeader";
import { CiContainer } from "./container/CiContainer";
import { CiCopyright, CiFooter } from "./footer";

interface LayoutProps {
  context: CiNextContext;
  status?: CiSystemStatus;
  protect?: boolean;
  children: React.ReactNode;
}

export default function CiLayout({
  context,
  // status,
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
      <main className="ci-main">
        <CiHeader context={context}>
          <CiMainHeaderNavigationBox context={context} />
          <CiHeaderLogo />
          <CiMainHeaderUserBox context={context} />
        </CiHeader>
        <CiContainer context={context}>{children}</CiContainer>
        <CiFooter
          checkList={
            {
              // amplifyOutputs: config.providers?.aws?.amplifyOutputs,
              //settings: config,
              // status: status,
            }
          }
          context={context}
        >
          <CiCopyright />
        </CiFooter>
      </main>
    </CiPageWrapper>
  );
}
