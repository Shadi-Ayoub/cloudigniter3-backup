import type { CiAwsExtensionPoliciesOptions } from "@ci-aws/types";

/** Least-privilege policies for the compiled module catalogue, scoped to one environment. */
export function ciAwsExtensionPolicies(input: CiAwsExtensionPoliciesOptions) {
  const arn = `arn:${input.partition}`;
  const tables = input.ids.map(
    (id) =>
      `${arn}:dynamodb:${input.region}:${input.account}:table/${input.prefix}-${id}`,
  );
  const stacks = input.ids.map(
    (id) =>
      `${arn}:cloudformation:${input.region}:${input.account}:stack/${input.prefix}-${id}/*`,
  );
  return {
    infrastructure: {
      actions: [
        "dynamodb:CreateTable",
        "dynamodb:DeleteTable",
        "dynamodb:DescribeTable",
        "dynamodb:TagResource",
        "dynamodb:UntagResource",
        "dynamodb:ListTagsOfResource",
      ],
      resources: tables,
    },
    lifecycle: { actions: ["cloudformation:CreateStack"], resources: stacks },
    cleanupStacks: {
      actions: ["cloudformation:DeleteStack", "cloudformation:DescribeStacks"],
      resources: [
        `${arn}:cloudformation:${input.region}:${input.account}:stack/${input.prefix}-*/*`,
      ],
    },
    cleanupTables: {
      actions: [
        "dynamodb:DeleteTable",
        "dynamodb:DescribeTable",
        "dynamodb:ListTagsOfResource",
      ],
      resources: [
        `${arn}:dynamodb:${input.region}:${input.account}:table/${input.prefix}-*`,
      ],
    },
    data: {
      actions: ["dynamodb:GetItem", "dynamodb:Query", "dynamodb:PutItem"],
      resources: tables,
    },
  };
}
