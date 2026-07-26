import React from "react";
import { useTranslations } from "next-intl";
import { ciCapitalizeFirstLetter } from "@cloudigniter/core/lib";
import { ciStartTraceServer } from "@cloudigniter/core/server";
import type { CiNextContext, CiSystemStatusCheckList } from "@ci-next/types";

interface FooterInterface {
  context: CiNextContext;
  checkList: CiSystemStatusCheckList;
  children: React.ReactNode;
}

export const CiFooter = ({ context, children }: FooterInterface) => {
  const t = useTranslations("mainFooter");

  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = ciStartTraceServer(
    context.config.appCoreConfig.dev.traceLog,
    { source: "server", prettyWave: true },
    { name: "<Footer>" },
  );

  logger.log({
    scope: "layout",
    event: `Rendering the <Footer> component`,
  });
  //////////////////////////////////////////////////////////////////////////////////////////////////

  return (
    <footer className="ci-main-footer">
      <div className="flex-1 text-left">{/* <CiSystemStatusDialog checkList={checkList} /> */}</div>

      <div style={{ flex: 1, textAlign: "center" }}>
        <span>{children}</span>
      </div>

      <div className="flex-1 text-right">
        <span>{ciCapitalizeFirstLetter(t("environment"))}:</span>&nbsp;
        <span className="text-secondary-400">{t(process.env.NODE_ENV)}</span>
      </div>
    </footer>
  );
};
