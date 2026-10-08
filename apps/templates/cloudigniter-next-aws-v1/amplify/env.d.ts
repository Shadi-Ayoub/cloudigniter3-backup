// Amplify generates this module during sandbox/deployment. Its runtime values
// remain provider-owned; this declaration permits an offline source typecheck.
declare module "$amplify/env/post-confirmation-handler" {
  export const env: import("@aws-amplify/backend/function/runtime").DataClientEnv & {
    AMPLIFY_DATA_GRAPHQL_ENDPOINT: string;
  };
}
