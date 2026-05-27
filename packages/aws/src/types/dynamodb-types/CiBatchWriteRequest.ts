import type { BatchWriteCommandInput } from '@aws-sdk/lib-dynamodb';

export type CiBatchWriteRequest = NonNullable<BatchWriteCommandInput['RequestItems']>[string][number];
