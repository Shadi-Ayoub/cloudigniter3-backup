import { type AppSyncResolverEvent } from "aws-lambda";
import type { CiApiInputArgs } from "@cloudigniter/core/types";

/**
 * AWS AppSync resolver invocation event delivered to a Lambda data source.
 *
 * Represents the payload sent by AWS AppSync when invoking a resolver,
 * including GraphQL arguments, identity context, and resolver metadata.
 */
export type CiAppSyncResolverEvent = AppSyncResolverEvent<CiApiInputArgs, any>;
