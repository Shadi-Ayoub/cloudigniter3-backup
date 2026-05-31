import type { CiPrintOutputFormat } from "./CiPrintOutputFormat";
import type { CiPrintOutputType } from "./CiPrintOutputType";

export type CiConsoleLogOptions = {
  format?: CiPrintOutputFormat;
  caption?: string;
  messageType?: CiPrintOutputType;
};
