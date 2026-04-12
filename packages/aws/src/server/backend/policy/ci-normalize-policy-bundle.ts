import type {
  CiNormalizedPolicyBundle,
  CiPolicyDocument,
  CiPolicyGroup,
  CiPolicyStatement,
  CiPolicyStatementSpec,
} from '../core-types/policy';

export function ciNormalizePolicyBundle(bundle: CiNormalizedPolicyBundle): CiPolicyDocument {
  const flattenedStatements = ciFlattenPolicyBundle(bundle);

  const normalizedStatements = flattenedStatements
    .map(ciNormalizePolicyStatement)
    .filter((statement): statement is CiPolicyStatementSpec => statement !== null);

  const deduplicatedStatements = ciDeduplicatePolicyStatements(normalizedStatements);
  const sortedStatements = ciSortPolicyStatements(deduplicatedStatements);

  return {
    Version: '2012-10-17',
    Statement: sortedStatements,
  };
}

export function ciFlattenPolicyBundle(bundle: CiNormalizedPolicyBundle): CiPolicyStatement[] {
  const groupKeys = Object.keys(bundle).sort(ciCompareStrings);
  const statements: CiPolicyStatement[] = [];

  for (const groupKey of groupKeys) {
    const group = bundle[groupKey];

    if (!ciIsPolicyGroup(group)) {
      continue;
    }

    for (const statement of group.statements) {
      statements.push(statement);
    }
  }

  return statements;
}

export function ciNormalizePolicyStatement(statement: CiPolicyStatement): CiPolicyStatementSpec | null {
  const effect = statement.effect;
  const action = ciNormalizeStringOrArray(statement.actions);
  const notAction = ciNormalizeStringOrArray(statement.notActions);
  const resource = ciNormalizeStringOrArray(statement.resources);
  const notResource = ciNormalizeStringOrArray(statement.notResources);
  const condition = ciNormalizeConditionBlock(statement.conditions);
  const sid = ciNormalizeOptionalString(statement.sid);

  if (effect !== 'Allow' && effect !== 'Deny') {
    return null;
  }

  const hasActionSide = !!action || !!notAction;
  const hasResourceSide = !!resource || !!notResource;

  if (!hasActionSide || !hasResourceSide) {
    return null;
  }

  const normalized: CiPolicyStatementSpec = {
    Effect: effect,
  };

  if (sid) normalized.Sid = sid;
  if (action) normalized.Action = action;
  if (notAction) normalized.NotAction = notAction;
  if (resource) normalized.Resource = resource;
  if (notResource) normalized.NotResource = notResource;
  if (condition) normalized.Condition = condition;

  return normalized;
}

export function ciDeduplicatePolicyStatements(statements: CiPolicyStatementSpec[]): CiPolicyStatementSpec[] {
  const seen = new Set<string>();
  const deduplicated: CiPolicyStatementSpec[] = [];

  for (const statement of statements) {
    const signature = ciBuildPolicyStatementSignature(statement);

    if (seen.has(signature)) {
      continue;
    }

    seen.add(signature);
    deduplicated.push(statement);
  }

  return deduplicated;
}

export function ciSortPolicyStatements(statements: CiPolicyStatementSpec[]): CiPolicyStatementSpec[] {
  return [...statements].sort((a, b) =>
    ciCompareStrings(ciBuildSortKeyForPolicyStatement(a), ciBuildSortKeyForPolicyStatement(b))
  );
}

export function ciBuildPolicyStatementSignature(statement: CiPolicyStatementSpec): string {
  return JSON.stringify(ciSortObjectDeep(statement));
}

export function ciBuildSortKeyForPolicyStatement(statement: CiPolicyStatementSpec): string {
  return [
    statement.Effect ?? '',
    statement.Sid ?? '',
    ciStableSerialize(statement.Action),
    ciStableSerialize(statement.NotAction),
    ciStableSerialize(statement.Resource),
    ciStableSerialize(statement.NotResource),
    ciStableSerialize(statement.Condition),
  ].join('|');
}

export function ciNormalizeStringOrArray(value?: string | string[]): string | string[] | undefined {
  if (value == null) return undefined;

  const values = Array.isArray(value) ? value : [value];

  const normalizedValues = [
    ...new Set(values.map((item) => item?.trim()).filter((item): item is string => !!item)),
  ].sort(ciCompareStrings);

  if (normalizedValues.length === 0) return undefined;
  if (normalizedValues.length === 1) return normalizedValues[0];

  return normalizedValues;
}

export function ciNormalizeConditionBlock(
  conditions?: Record<string, Record<string, unknown>>
): Record<string, Record<string, unknown>> | undefined {
  if (!conditions || typeof conditions !== 'object' || Array.isArray(conditions)) {
    return undefined;
  }

  const normalized: Record<string, Record<string, unknown>> = {};

  for (const operator of Object.keys(conditions).sort(ciCompareStrings)) {
    const operatorBlock = conditions[operator];

    if (!operatorBlock || typeof operatorBlock !== 'object' || Array.isArray(operatorBlock)) {
      continue;
    }

    const normalizedOperatorBlock: Record<string, unknown> = {};

    for (const conditionKey of Object.keys(operatorBlock).sort(ciCompareStrings)) {
      const value = operatorBlock[conditionKey];
      const normalizedValue = ciNormalizeUnknownValue(value);

      if (normalizedValue !== undefined) {
        normalizedOperatorBlock[conditionKey] = normalizedValue;
      }
    }

    if (Object.keys(normalizedOperatorBlock).length > 0) {
      normalized[operator] = normalizedOperatorBlock;
    }
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

export function ciNormalizeOptionalString(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function ciIsPolicyGroup(value: unknown): value is CiPolicyGroup {
  return !!value && typeof value === 'object' && Array.isArray((value as CiPolicyGroup).statements);
}

export function ciNormalizeUnknownValue(value: unknown): unknown {
  if (value == null) return undefined;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }

  if (Array.isArray(value)) {
    const normalizedArray = value
      .map(ciNormalizeUnknownValue)
      .filter((item): item is Exclude<typeof item, undefined> => item !== undefined);

    if (normalizedArray.length === 0) return undefined;

    if (normalizedArray.every((item) => typeof item === 'string')) {
      return [...new Set(normalizedArray)].sort(ciCompareStrings);
    }

    return normalizedArray;
  }

  if (typeof value === 'object') {
    const sortedObject = ciSortObjectDeep(value as Record<string, unknown>);
    return Object.keys(sortedObject).length > 0 ? sortedObject : undefined;
  }

  return value;
}

export function ciSortObjectDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => ciSortObjectDeep(item)) as T;
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};

    for (const key of Object.keys(record).sort(ciCompareStrings)) {
      const normalizedValue = ciSortObjectDeep(record[key]);

      if (normalizedValue !== undefined) {
        sorted[key] = normalizedValue;
      }
    }

    return sorted as T;
  }

  return value;
}

export function ciStableSerialize(value: unknown): string {
  return JSON.stringify(ciSortObjectDeep(value));
}

export function ciCompareStrings(a: string, b: string): number {
  return a.localeCompare(b);
}
