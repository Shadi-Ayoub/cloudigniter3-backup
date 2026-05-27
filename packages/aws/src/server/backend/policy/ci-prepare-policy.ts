import { ciBuildResourcePolicyFragment } from "../resources";
import { ciNormalizePolicyBundle } from "./ci-normalize-policy-bundle";

import type { CiCoreResources } from "../resources/resource-types";
import type { CiPlanOptions } from "../core-types/plan";
import type { CiTableGrantSpec } from "../core-types/tables";

import type {
  CiNormalizedPolicyBundle,
  CiPolicyFragment,
  CiInlinePolicySpec,
  CiPolicyStatement,
} from "../core-types/policy";

import type {
  CiPolicyStatementInput,
  CiPreparedPolicyInterface,
} from "../core-types/policy";

export function ciPreparePolicy(
  resources: CiCoreResources,
  options: CiPlanOptions,
  region: string,
  envMode: string,
  extra?: Record<string, unknown>,
): CiPreparedPolicyInterface {
  const merged = ciBuildResourcePolicyFragment({
    resources,
    region,
    envMode,
    options,
    extra,
  });

  const normalizedPolicyDocument = ciNormalizePolicyBundle(
    ciBuildPolicyBundleFromFragments(merged, resources),
  );

  return {
    inlinePolicies: merged.inlinePolicies ?? [],
    commonStatements: merged.commonStatements ?? [],
    tableGrants: merged.tableGrants ?? [],
    normalizedPolicyDocument,
  };
}

export function ciMergePolicyFragments(
  ...fragments: CiPolicyFragment[]
): CiPolicyFragment {
  const acc: CiPolicyFragment = {
    inlinePolicies: [],
    commonStatements: [],
    tableGrants: [],
  };

  for (const fragment of fragments) {
    if (fragment.inlinePolicies?.length) {
      acc.inlinePolicies!.push(...fragment.inlinePolicies);
    }

    if (fragment.commonStatements?.length) {
      acc.commonStatements!.push(...fragment.commonStatements);
    }

    if (fragment.tableGrants?.length) {
      acc.tableGrants!.push(...fragment.tableGrants);
    }
  }

  return acc;
}

export function ciBuildPolicyBundleFromFragments(
  fragment: CiPolicyFragment,
  resources: CiCoreResources,
): CiNormalizedPolicyBundle {
  const bundle: CiNormalizedPolicyBundle = {};

  if (fragment.inlinePolicies?.length) {
    fragment.inlinePolicies.forEach((inlinePolicy, index) => {
      const key = ciBuildInlinePolicyBundleKey(inlinePolicy, index);

      bundle[key] = {
        source: "ciBuildPolicyBundleFromFragments:inlinePolicies",
        description: `Inline policy for function "${inlinePolicy.for}"`,
        statements: inlinePolicy.statements.map(
          ciMapStatementInputToBundleStatement,
        ),
      };
    });
  }

  if (fragment.commonStatements?.length) {
    bundle.commonStatements = {
      source: "ciBuildPolicyBundleFromFragments:commonStatements",
      description: "Common shared policy statements",
      statements: fragment.commonStatements.map(
        ciMapStatementInputToBundleStatement,
      ),
    };
  }

  if (fragment.tableGrants?.length) {
    bundle.tableGrants = {
      source: "ciBuildPolicyBundleFromFragments:tableGrants",
      description: "Table grant policy statements",
      statements: fragment.tableGrants.map((grant) =>
        ciMapTableGrantToBundleStatement(grant, resources),
      ),
    };
  }

  return bundle;
}

export function ciMapStatementInputToBundleStatement(
  statement: CiPolicyStatementInput,
): CiPolicyStatement {
  return {
    effect: statement.effect,
    actions: statement.actions,
    resources: statement.resources,
  };
}

export function ciMapTableGrantToBundleStatement(
  grant: CiTableGrantSpec,
  resources: CiCoreResources,
): CiPolicyStatement {
  const tableInfo = ciResolveTableInfoFromResources(grant.table, resources);

  return {
    sid: ciBuildTableGrantSid(grant),
    effect: "Allow",
    actions: ciExpandTableGrantActions(grant.actions),
    resources: [tableInfo.arn, `${tableInfo.arn}/index/*`],
  };
}

export function ciResolveTableInfoFromResources(
  table: CiTableGrantSpec["table"],
  resources: CiCoreResources,
) {
  switch (table) {
    case "privateSettingsTable":
      return resources.privateSettingsTable;
    case "publicSettingsTable":
      return resources.publicSettingsTable;
    case "systemTable":
      return resources.systemTable;
    case "userProfileTable":
      return resources.userProfileTable;
    case "userSettingsTable":
      return resources.userSettingsTable;
  }
}

export function ciExpandTableGrantActions(
  actions: CiTableGrantSpec["actions"],
): string[] {
  const expanded = new Set<string>();

  for (const action of actions) {
    switch (action) {
      case "Read":
        expanded.add("dynamodb:GetItem");
        expanded.add("dynamodb:Query");
        expanded.add("dynamodb:Scan");
        break;

      case "Write":
        expanded.add("dynamodb:PutItem");
        expanded.add("dynamodb:UpdateItem");
        expanded.add("dynamodb:DeleteItem");
        expanded.add("dynamodb:BatchWriteItem");
        expanded.add("dynamodb:TransactWriteItems");
        break;

      case "BatchWriteItem":
      case "DeleteItem":
      case "GetItem":
      case "PutItem":
      case "Query":
      case "Scan":
      case "TransactWriteItems":
      case "UpdateItem":
        expanded.add(`dynamodb:${action}`);
        break;
    }
  }

  return [...expanded].sort((a, b) => a.localeCompare(b));
}

export function ciBuildInlinePolicyBundleKey(
  inlinePolicy: CiInlinePolicySpec,
  index: number,
): string {
  const safeId = inlinePolicy.id?.trim();

  return safeId
    ? `inlinePolicy:${inlinePolicy.for}:${safeId}`
    : `inlinePolicy:${inlinePolicy.for}:${index + 1}`;
}

export function ciBuildTableGrantSid(grant: CiTableGrantSpec): string {
  return ["TableGrant", grant.for, grant.table, ...grant.actions].join("_");
}
