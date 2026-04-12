export type CiLambdaReportLog = {
  requestId: string;
  durationMs: number;
  billedDurationMs: number;
  memorySizeMb: number;
  maxMemoryUsedMb: number;
  initDurationMs: number | null;
  rawReport: string;
  logGroupName: string;
  logStreamName: string;
};
