import type { CiDynamoExistenceMode } from "@ci-aws/types";

/**
 * Build a DynamoDB existence condition expression from a key object.
 *
 * Semantics:
 * - "any"        => no condition
 * - "insertOnly" => all key attributes must NOT exist
 * - "updateOnly" => all key attributes must exist
 * - "deleteOnly" => all key attributes must exist
 */
export function ciBuildDynamoExistenceCondition(
  key: Record<string, any>,
  existence: CiDynamoExistenceMode = "any",
): {
  expression?: string;
  names?: Record<string, string>;
} {
  if (existence === "any") {
    return {};
  }

  const keys = Object.keys(key);
  if (keys.length === 0) {
    return {};
  }

  const names: Record<string, string> = {};

  const checks = keys.map((keyName, index) => {
    const placeholder = `#k${index}`;
    names[placeholder] = keyName;

    const fn =
      existence === "insertOnly" ? "attribute_not_exists" : "attribute_exists";

    return `${fn}(${placeholder})`;
  });

  return {
    expression: checks.join(" AND "),
    names,
  };
}
