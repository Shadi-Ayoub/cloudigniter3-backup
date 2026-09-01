/**
 * Serialize one domain value for an AWS AppSync `AWSJSON` scalar.
 *
 * AppSync accepts AWSJSON variables as JSON strings, even when the
 * application keeps the corresponding value as an object or array.
 */
export function ciSerializeAwsJson(value: unknown): string {
  let serialized: string | undefined;
  try {
    serialized = JSON.stringify(value);
  } catch {
    throw new TypeError("AWSJSON values must be JSON-serializable.");
  }

  if (serialized === undefined) {
    throw new TypeError("AWSJSON values must be JSON-serializable.");
  }
  return serialized;
}

/**
 * Decode an AWSJSON transport string while preserving values a client has
 * already decoded.
 */
export function ciDeserializeAwsJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw new TypeError("AWSJSON responses must contain valid JSON.");
  }
}

const CI_USER_PROFILE_AWS_JSON_FIELDS = [
  "address",
  "extensions",
  "statusChange",
  "deletion",
] as const;

type CiUserProfileAwsJsonField =
  (typeof CI_USER_PROFILE_AWS_JSON_FIELDS)[number];

/**
 * Encode every AWSJSON-backed field that can occur in an Amplify UserProfile
 * create or update input. Undefined fields are omitted and `null` is preserved
 * so update mutations can clear an optional value.
 */
export function ciSerializeUserProfileAwsJsonFields<
  TInput extends Record<string, unknown>,
>(
  input: TInput,
): Omit<TInput, CiUserProfileAwsJsonField> &
  Partial<Record<CiUserProfileAwsJsonField, string | null>> {
  const serialized: Record<string, unknown> = { ...input };
  for (const field of CI_USER_PROFILE_AWS_JSON_FIELDS) {
    const value = serialized[field];
    if (value === undefined) {
      delete serialized[field];
    } else if (value !== null) {
      serialized[field] = ciSerializeAwsJson(value);
    }
  }
  return serialized as Omit<TInput, CiUserProfileAwsJsonField> &
    Partial<Record<CiUserProfileAwsJsonField, string | null>>;
}
