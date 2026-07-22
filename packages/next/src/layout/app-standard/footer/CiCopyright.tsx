import { useTranslations } from "next-intl";

import { ciStartTraceServer } from "@cloudigniter/core/server";
import { ciCapitalizeFirstLetter } from "@cloudigniter/core/lib";
import type { CiNextPageConfig } from "@ci-next/types";

interface CopyrightInterface {
  config: CiNextPageConfig;
}

export const CiCopyright = ({ config }: CopyrightInterface) => {
  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = ciStartTraceServer(
    config.coreConfig.dev.traceLog,
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
