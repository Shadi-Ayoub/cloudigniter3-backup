import { type AppSyncResolverEvent } from "aws-lambda";
import type { CiApiInputArgs } from "./CiApiInputArgs";

export type CiLambdaEvent = AppSyncResolverEvent<CiApiInputArgs, any>;
