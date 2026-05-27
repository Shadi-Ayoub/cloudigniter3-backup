import type { DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import type { CiGetSettingsHandlerInput } from "@cloudigniter/core/types";

export type CiGetSettingsHandlerInterface = {
  input: CiGetSettingsHandlerInput;
  clientConfig: DynamoDBClientConfig;
};
