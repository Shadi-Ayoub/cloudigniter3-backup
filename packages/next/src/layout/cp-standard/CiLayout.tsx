import { ciStartTraceServer } from "@cloudigniter/core/server";
import { type CiSystemStatus } from "@cloudigniter/core/types";
import type { CiNextContext } from "@ci-next/types";
import { CiPageWrapper } from "@ci-next/server";
import { CiNextHeaderLogo } from "@ci-next/ui/client";
import { CiMainHeaderNavigationBox, CiMainHeaderUserBox } from "@ci-next/ui/server";
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
      <a className="ci-skip-link" href="#ci-main-content">
        Skip to main content
      </a>
      <main id="ci-main-content" className="ci-main" tabIndex={-1}>
        <CiHeader context={context}>
          <CiMainHeaderNavigationBox context={context} />
          <CiNextHeaderLogo
            traceConfig={context.config.appCoreConfig.dev.traceLog}
          />
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
