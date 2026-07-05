import { type AppSyncResolverEvent } from "aws-lambda";
import type { CiApiInputArgs } from "@cloudigniter/core/types";

export type CiLambdaEvent = AppSyncResolverEvent<CiApiInputArgs, any>;
