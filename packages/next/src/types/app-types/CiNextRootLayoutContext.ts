import type { CiRootLayoutContext } from "@cloudigniter/core/types";
import type { CiNextContext, CiNextResolvedConfig } from "@ci-next/types";

export type CiNextRootLayoutContext = CiRootLayoutContext & {
  ctx: CiNextContext;
};
