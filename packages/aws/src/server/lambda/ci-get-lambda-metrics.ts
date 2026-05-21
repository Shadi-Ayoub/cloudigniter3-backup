import {
  CloudWatchClient,
  GetMetricStatisticsCommand,
} from "@aws-sdk/client-cloudwatch";
import {
  ciError500,
  ciOk200,
  ciSerializeUnknownError,
} from "@cloudigniter/core";
import { type CiResult } from "@cloudigniter/core/types";
import { ciNormalizeThrownError } from "@cloudigniter/core/server";

const ciCloudWatchClient = new CloudWatchClient({});

export async function ciGetLambdaMetrics(
  functionName: string,
  duration: number = 60,
): Promise<CiResult<unknown>> {
  try {
    const command = new GetMetricStatisticsCommand({
      MetricName: "Duration",
      Namespace: "AWS/Lambda",
      Dimensions: [{ Name: "FunctionName", Value: functionName }],
      StartTime: new Date(Date.now() - duration * 60 * 1000),
      EndTime: new Date(),
      Period: 60,
      Statistics: ["Average"],
    });

    const response = await ciCloudWatchClient.send(command);

    return ciOk200(response);
  } catch (error) {
    const ciError = ciNormalizeThrownError(error);

    return ciError500(ciError.message || "Failed to fetch Lambda metrics.");
  }
}
