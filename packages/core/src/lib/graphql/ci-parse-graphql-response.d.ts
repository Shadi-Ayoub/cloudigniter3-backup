import type { CiGraphQLResponse, CiResponse } from "@ci-core/types";
/**
 * Converts a raw `CiGraphQLResponse` into your canonical `CiResponse` envelope.
 *
 * Why this exists
 * - GraphQL responses can represent failure in multiple ways:
 *   - `errors[]` populated (GraphQL-level errors)
 *   - `data` missing/null (common for delete mutations or resolvers returning nothing)
 * - Additionally, `data` may be:
 *   - already-structured JSON (object/array/primitive)
 *   - a JSON string that needs parsing
 *   - (sometimes) an already-wrapped `CiResponse` returned by your resolver/handler
 *
 * What it returns
 * - Always returns a `CiResponse`:
 *   1) If `errors[]` exist:
 *      - returns a 400 error response with combined error messages
 *      - attaches the original GraphQL response under `debug.response`
 *   2) If `data == null` (no errors):
 *      - returns a 200 ok response with an empty object body
 *      - attaches the original GraphQL response under `debug.response`
 *   3) Otherwise:
 *      - parses/normalizes data via `ciParseGraphqlResponseData`
 *      - if the parsed value is already a `CiResponse`, it is passed through
 *        (and we ensure `debug.response` points to the original GraphQL response)
 *      - else the parsed value is wrapped in a 200 ok `CiResponse`
 *
 * Error handling mode
 * - `critical` is forwarded to `ciParseGraphqlResponseData`:
 *   - `true`  → throws on errors / parse issues
 *   - `false` → returns a 400-shaped error response on parse issues
 *
 * Important:
 * - Your `CiResponseMeta` does **not** include a top-level `response` property.
 *   Use `debug.response` instead.
 */
export declare function ciParseGraphqlResponse(input: CiGraphQLResponse, critical?: boolean): CiResponse;
//# sourceMappingURL=ci-parse-graphql-response.d.ts.map