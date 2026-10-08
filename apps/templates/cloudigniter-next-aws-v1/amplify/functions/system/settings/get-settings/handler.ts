import { ciCreateAwsSettingsHandlers } from "@cloudigniter/aws/server/backend";
import { ciBuildSettingsRegistry } from "../../../../../src/custom/settings/ci-settings-registry";
import type { Schema } from "../../../../data/resource";
const handlers = ciCreateAwsSettingsHandlers({ registry: ciBuildSettingsRegistry() });
export const handler: Schema["GetSettings"]["functionHandler"] = event => handlers.get(event);
