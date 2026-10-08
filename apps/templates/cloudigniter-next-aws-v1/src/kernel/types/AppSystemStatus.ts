import type { AppSystemStatusItem } from "./AppSystemStatusItem";

export type AppSystemStatus = {
  overall?: "success" | "error";
  amplifyConfig?: AppSystemStatusItem;
  amplifySchema?: AppSystemStatusItem;
  systemSettings?: AppSystemStatusItem;
  // in future: database: SystemStatusItem, apiGateway: SystemStatusItem, etc.
};
