import type { AbstractIntlMessages } from "next-intl";
import type { CiPageSetup } from "@cloudigniter/core/client";

export type CiNextPageSetup = CiPageSetup & {
  messages?: AbstractIntlMessages;
};
