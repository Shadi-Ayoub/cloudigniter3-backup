import { useTranslations } from "next-intl";

import { ciCapitalizeFirstLetter, ciStartTrace } from "@cloudigniter/core";
import type { CiResolvedPageConfig } from "@/.";

interface CopyrightInterface {
  config: CiResolvedPageConfig;
}

export const CiCopyright = ({ config }: CopyrightInterface) => {
  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = ciStartTrace(
    config.ciConfig.traceLog,
    { source: "server", prettyWave: true },
    { name: "<Copyright>" },
  );

  logger.log({
    scope: "layout",
    event: `Rendering the <Copyright> component`,
  });
  //////////////////////////////////////////////////////////////////////////////////////////////////

  const t = useTranslations("mainFooter");

  return (
    <p className="text-sm">
      &copy; {new Date().getFullYear()} Cloudigniter.{" "}
      {ciCapitalizeFirstLetter(t("all rights reserved"), true)}
    </p>
  );
};
