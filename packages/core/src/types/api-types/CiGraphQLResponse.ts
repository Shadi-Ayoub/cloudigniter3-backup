import type { CiJsonValue } from "@/types";
import type { CiGraphQLError } from "./CiGraphQLError";
import type { CiNullable } from "./CiNullable";

// Result object from the API (Amplify Data)
export type CiGraphQLResponse = {
  data: CiNullable<CiJsonValue>;
  errors?: CiGraphQLError[];
  extensions?: {
    [key: string]: unknown;
  };
};
