import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import util from 'node:util';

import { ciNormalizePolicyBundle } from './ci-normalize-policy-bundle';

import type { CiNormalizedPolicyBundle, CiPolicyDocument } from '../core-types/policy';

export type CiWritePolicyBundleReportSuiteInput<T extends CiNormalizedPolicyBundle = CiNormalizedPolicyBundle> = {
  bundle: T;
  rootDir: string;
  outputDir?: string;
  envName?: string;
  source?: string;
};

export type CiPolicyBundleReportSummary = {
  generatedAt: string;
  envName: string | null;
  source: string | null;
  totals: {
    statementCount: number;
    actionCount: number;
    resourceCount: number;
    conditionCount: number;
    sidCount: number;
  };
};

export type CiWritePolicyBundleReportSuiteOutput = {
  ok: true;
  normalized: CiPolicyDocument;
  outputDir: string;
  files: {
    normalizedJson: string;
    summaryJson: string;
    treeText: string;
  };
};

export async function ciWritePolicyBundleReportSuite<T extends CiNormalizedPolicyBundle>(
  input: CiWritePolicyBundleReportSuiteInput<T>
): Promise<CiWritePolicyBundleReportSuiteOutput> {
  const { bundle, rootDir, outputDir = 'reports/policy-bundle', envName, source } = input;

  const normalized = ciNormalizePolicyBundle(bundle);
  const resolvedOutputDir = path.resolve(rootDir, outputDir);

  await mkdir(resolvedOutputDir, { recursive: true });

  const generatedAt = new Date().toISOString();

  const summary = ciBuildPolicyBundleReportSummary({
    normalized,
    generatedAt,
    envName: envName ?? null,
    source: source ?? null,
  });

  const normalizedPayload = {
    generatedAt,
    envName: envName ?? null,
    source: source ?? null,
    kind: 'ci-policy-bundle-normalized-report',
    normalized,
  };

  const treeText = ciBuildPolicyBundleTreeText({
    normalized,
    generatedAt,
    envName: envName ?? null,
    source: source ?? null,
  });

  const normalizedJsonPath = path.join(resolvedOutputDir, 'policy-bundle.normalized.json');
  const summaryJsonPath = path.join(resolvedOutputDir, 'policy-bundle.summary.json');
  const treeTextPath = path.join(resolvedOutputDir, 'policy-bundle.tree.txt');

  await Promise.all([
    writeFile(normalizedJsonPath, JSON.stringify(normalizedPayload, null, 2), 'utf8'),
    writeFile(summaryJsonPath, JSON.stringify(summary, null, 2), 'utf8'),
    writeFile(treeTextPath, treeText, 'utf8'),
  ]);

  return {
    ok: true,
    normalized,
    outputDir: resolvedOutputDir,
    files: {
      normalizedJson: normalizedJsonPath,
      summaryJson: summaryJsonPath,
      treeText: treeTextPath,
    },
  };
}

export function ciBuildPolicyBundleReportSummary(input: {
  normalized: CiPolicyDocument;
  generatedAt: string;
  envName: string | null;
  source: string | null;
}): CiPolicyBundleReportSummary {
  const { normalized, generatedAt, envName, source } = input;
  const statements = ciExtractPolicyStatements(normalized);

  let actionCount = 0;
  let resourceCount = 0;
  let conditionCount = 0;
  let sidCount = 0;

  for (const statement of statements) {
    if (statement.Sid) sidCount += 1;
    actionCount += ciCountMaybeArray(statement.Action);
    actionCount += ciCountMaybeArray(statement.NotAction);
    resourceCount += ciCountMaybeArray(statement.Resource);
    resourceCount += ciCountMaybeArray(statement.NotResource);

    if (statement.Condition) {
      conditionCount += Object.keys(statement.Condition).length;
    }
  }

  return {
    generatedAt,
    envName,
    source,
    totals: {
      statementCount: statements.length,
      actionCount,
      resourceCount,
      conditionCount,
      sidCount,
    },
  };
}

export function ciBuildPolicyBundleTreeText(input: {
  normalized: CiPolicyDocument;
  generatedAt: string;
  envName: string | null;
  source: string | null;
}): string {
  const { normalized, generatedAt, envName, source } = input;
  const statements = ciExtractPolicyStatements(normalized);

  const lines: string[] = [];
  lines.push('CloudIgniter Policy Bundle Report');
  lines.push('================================');
  lines.push(`Generated At : ${generatedAt}`);
  lines.push(`Environment  : ${envName ?? 'n/a'}`);
  lines.push(`Source       : ${source ?? 'n/a'}`);
  lines.push(`Statements   : ${statements.length}`);
  lines.push('');

  statements.forEach((statement, index) => {
    lines.push(`Statement #${index + 1}`);
    lines.push(`  Sid       : ${ciFormatScalar(statement.Sid)}`);
    lines.push(`  Effect    : ${ciFormatScalar(statement.Effect)}`);
    lines.push(`  Action    : ${ciFormatList(statement.Action ?? statement.NotAction)}`);
    lines.push(`  Resource  : ${ciFormatList(statement.Resource ?? statement.NotResource)}`);

    if (statement.Condition) {
      lines.push('  Condition :');
      lines.push(ciIndentMultiline(util.inspect(statement.Condition, { depth: null, colors: false }), 4));
    } else {
      lines.push('  Condition : none');
    }

    lines.push('');
  });

  lines.push('Full Normalized Snapshot');
  lines.push('------------------------');
  lines.push(util.inspect(normalized, { depth: null, colors: false }));
  lines.push('');

  return lines.join('\n');
}

export function ciExtractPolicyStatements(normalized: CiPolicyDocument): CiPolicyDocument['Statement'] {
  return Array.isArray(normalized.Statement) ? normalized.Statement : [];
}

function ciCountMaybeArray(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (value == null) return 0;
  return 1;
}

function ciFormatScalar(value: unknown): string {
  if (value == null) return 'n/a';
  if (typeof value === 'string') return value;
  return util.inspect(value, { depth: null, colors: false });
}

function ciFormatList(value: unknown): string {
  if (value == null) return 'n/a';
  if (Array.isArray(value)) return value.length === 0 ? '[]' : value.map(ciFormatScalar).join(', ');
  return ciFormatScalar(value);
}

function ciIndentMultiline(value: string, spaces: number): string {
  const prefix = ' '.repeat(spaces);
  return value
    .split('\n')
    .map((line) => `${prefix}${line}`)
    .join('\n');
}
