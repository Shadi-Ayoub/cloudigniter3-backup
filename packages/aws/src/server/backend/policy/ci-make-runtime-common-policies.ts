import type { CiPolicyFragment } from '../core-types/policy';

/**
 * Build the baseline runtime IAM policy fragment required by most
 * CloudIgniter Lambda handlers.
 *
 * Purpose
 * -------
 * This helper provides cross-cutting runtime permissions that are not tied
 * to a specific resource module such as auth, settings, or tenant data.
 *
 * Included capabilities
 * ---------------------
 * - Write application logs to CloudWatch Logs
 * - Read log streams/events when needed by runtime tooling
 * - Publish AWS X-Ray tracing data
 * - Read CloudWatch metric statistics
 *
 * Notes
 * -----
 * - These are intentionally returned as `commonStatements` because they are
 *   platform-level runtime permissions shared by multiple handlers.
 * - Resource-specific permissions should still come from resource modules
 *   via `resolvePolicies(...)`.
 */
export function ciMakeRuntimeCommonPolicies(): CiPolicyFragment {
  return {
    commonStatements: [
      {
        effect: 'Allow',
        actions: [
          'cloudwatch:GetMetricStatistics',
          'logs:DescribeLogStreams',
          'logs:GetLogEvents',
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          'xray:PutTraceSegments',
          'xray:PutTelemetryRecords',
        ],
        resources: ['*'],
      },
    ],
  };
}
