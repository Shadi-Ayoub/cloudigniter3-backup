import type { CiGraphQLResponse, CiJsonValue, CiParseErrorResponse } from "@ci-core/types";
/**
 * Parses and normalizes `response.data` from a GraphQL response.
 *
 * - If `critical` is omitted or `true`, throws on:
 *   GraphQL errors, null/undefined data, JSON parse errors, or unsupported runtime types.
 * - If `critical === false`, returns either the parsed value (Ok) or a 400 `ParseErrorResponse`.
 *
 * `Ok` can be specified at the call site for strong typing:
 * `const data = ciParseGraphqlResponseData<{ user: { id: string } }>(resp);`
 */
export declare function ciParseGraphqlResponseData<Ok = CiJsonValue>(response: CiGraphQLResponse, critical?: boolean): Ok | CiParseErrorResponse;
//# sourceMappingURL=ci-parse-graphql-response-data.d.ts.map