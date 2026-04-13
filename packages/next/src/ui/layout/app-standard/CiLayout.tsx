import React from "react";

import { CiDashboardHeaderButton, CiMainHeaderUserBox } from "@/ui";
import { CiPageWrapper } from "@/provider";
import { startTrace } from "@CI/trace";
import type { CiPageConfig } from "@CI/types";

import { Header } from "./Header";
import { Container } from "./Container";
import { Copyright, Footer } from "./Footer";

interface CiLayoutProps {
  config: CiPageConfig;
  protect: boolean;
  children: React.ReactNode;
}

const CiLayout: React.FC<CiLayoutProps> = ({
  config,
  protect,
  children,
}: CiLayoutProps) => {
  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = startTrace(
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
    <CloudIgniterPageWrapper config={config} protect={protect}>
      <Header config={config}>
        <HeaderDashboardButton config={config} />
        <div></div>
        <MainHeaderUserBox config={config} />
      </Header>
      <Container config={config}>{children}</Container>
      <Footer config={config}>
        <Copyright config={config} />
      </Footer>
    </CloudIgniterPageWrapper>
  );
};

export default CiLayout;
