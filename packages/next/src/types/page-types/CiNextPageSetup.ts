import type { AbstractIntlMessages } from "next-intl";
import type { CiPageSetup } from "@cloudigniter/core/types";

export type CiNextPageSetup = CiPageSetup & {
  messages?: AbstractIntlMessages;
};
