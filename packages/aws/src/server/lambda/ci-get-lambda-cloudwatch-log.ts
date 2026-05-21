import {
  CloudWatchLogsClient,
  DescribeLogStreamsCommand,
  GetLogEventsCommand,
} from "@aws-sdk/client-cloudwatch-logs";

import {
  ciError500,
  ciOk200,
  ciSerializeUnknownError,
} from "@cloudigniter/core";
import { type CiResult } from "@cloudigniter/core/types";
import { ciNormalizeThrownError } from "@cloudigniter/core/server";
import type { CiLambdaReportLog } from "./";

const ciCloudWatchLogsClient = new CloudWatchLogsClient({});

/**
 * Read the most recent Lambda REPORT log line from the latest log streams.
 *
 * Notes:
 * - This is AWS-specific and should remain in the AWS package.
 * - The parsing is best-effort because Lambda REPORT log formatting may vary.
 */
export async function ciGetLambdaCloudwatchLog(
  functionName: string,
): Promise<CiResult<CiLambdaReportLog | null>> {
  const logGroupName = `/aws/lambda/${functionName}`;

  try {
    const logStreamsResponse = await ciCloudWatchLogsClient.send(
      new DescribeLogStreamsCommand({
        logGroupName,
        orderBy: "LastEventTime",
        descending: true,
        limit: 3,
      }),
    );

    const logStreams = logStreamsResponse.logStreams ?? [];

    if (logStreams.length === 0) {
      return ciOk200(null);
    }

    for (const stream of logStreams) {
      const logStreamName = stream.logStreamName;
      if (!logStreamName) continue;

      const logEventsResponse = await ciCloudWatchLogsClient.send(
        new GetLogEventsCommand({
          logGroupName,
          logStreamName,
          limit: 100,
          startFromHead: false,
        }),
      );

      const events = logEventsResponse.events ?? [];
      if (events.length === 0) continue;

      const reportLine = [...events]
        .reverse()
        .find((event) => event.message?.includes("REPORT"));

      if (!reportLine?.message) continue;

      const parsed = ciParseLambdaReportLine(
        reportLine.message,
        logGroupName,
        logStreamName,
      );

      if (parsed) {
        return ciOk200(parsed);
      }
    }

    return ciOk200(null);
  } catch (error) {
    const ciError = ciNormalizeThrownError(error);

    return ciError500(
      ciError.message || "Failed to fetch Lambda CloudWatch logs.",
      ciSerializeUnknownError(ciError.raw),
    );
  }
}

/**
 * Parse a Lambda REPORT log line into a structured object.
 */
function ciParseLambdaReportLine(
  reportLine: string,
  logGroupName: string,
  logStreamName: string,
): CiLambdaReportLog | null {
  const regex =
    /REPORT RequestId: ([\w-]+)\s+Duration: ([\d.]+) ms\s+Billed Duration: (\d+) ms\s+Memory Size: (\d+) MB\s+Max Memory Used: (\d+) MB(?:\s+Init Duration: ([\d.]+) ms)?/;

  const match = reportLine.match(regex);

  if (!match || match.length < 6) {
    return null;
  }

  const [
    ,
    requestId,
    duration,
    billedDuration,
    memorySize,
    maxMemoryUsed,
    initDuration,
  ] = match;

  if (
    !requestId ||
    !duration ||
    !billedDuration ||
    !memorySize ||
    !maxMemoryUsed
  ) {
    return null;
  }

  return {
    requestId,
    durationMs: Number.parseFloat(duration),
    billedDurationMs: Number.parseInt(billedDuration, 10),
    memorySizeMb: Number.parseInt(memorySize, 10),
    maxMemoryUsedMb: Number.parseInt(maxMemoryUsed, 10),
    initDurationMs: initDuration ? Number.parseFloat(initDuration) : null,
    rawReport: reportLine,
    logGroupName,
    logStreamName,
  };
}
