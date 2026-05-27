import type { CiSystemStatusItem } from "./CiSystemStatusItem";

export type CiSystemStatus = {
  overall?: "success" | "error";
  amplifyConfig?: CiSystemStatusItem;
  amplifySchema?: CiSystemStatusItem;
  systemSettings?: CiSystemStatusItem;
  // in future: database: SystemStatusItem, apiGateway: SystemStatusItem, etc.
};
