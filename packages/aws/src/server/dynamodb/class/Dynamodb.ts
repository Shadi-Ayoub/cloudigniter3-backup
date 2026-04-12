import {
  DynamoDBClient,
  type DynamoDBClientConfig,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  type QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { fetchAuthSession } from "aws-amplify/auth";

import type {
  CiErrorBody,
  CiErrorStatus,
  CiJsonValue,
  CiResult,
} from "@cloudigniter/core";

import {
  readItem as ciReadItemFn,
  type ProjectionInput,
  type ReadItemResult,
} from "./ci-read-dynamodb-item";
import {
  queryItems as ciQueryItemsFn,
  type QueryItemsResult,
} from "./ci-query-dynamodb-items";
import {
  writeItem as ciWriteItemFn,
  type WriteItemOptions,
  type WriteItemResult,
} from "./ci-write-dynamodb-item";
import {
  deleteItem as ciDeleteItemFn,
  type CiDeleteItemResult,
} from "./ci-delete-dynamodb-item";
import { transactWrite as ciTransactWriteFn } from "./ci-transact-dynamodb-write";
import { batchWriteItems as ciBatchWriteItemsFn } from "./ci-batch-write-dynamodb-items";

import type {
  CiBatchWriteItemsResult,
  CiBatchWriteRequest,
  CiDeleteItemOptions,
  CiDynamoMetricsOption,
  CiTransactWriteOptions,
  CiTransactWriteResult,
} from "../types";

/**
 * Success payload returned by `initialize()`.
 */
export type CiDynamodbInitializeBody = {
  client: DynamoDBDocumentClient;
};

/**
 * Result type returned by `initialize()`.
 */
export type CiDynamodbInitializeResult = CiResult<
  CiDynamodbInitializeBody,
  CiErrorBody,
  200,
  CiErrorStatus
>;

/**
 * Detects whether this code is currently executing inside an AWS Lambda runtime.
 */
function ciInLambda(): boolean {
  return Boolean(
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
      (process.env.AWS_EXECUTION_ENV &&
        process.env.AWS_EXECUTION_ENV.startsWith("AWS_Lambda_")),
  );
}

/**
 * Converts unknown thrown values into a JSON-safe details payload.
 */
function ciSerializeUnknownError(error: unknown): CiJsonValue {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack ?? "",
    };
  }

  if (typeof error === "string") return error;
  if (
    typeof error === "number" ||
    typeof error === "boolean" ||
    error === null
  ) {
    return error;
  }

  try {
    return JSON.parse(JSON.stringify(error)) as CiJsonValue;
  } catch {
    return String(error);
  }
}

/**
 * Builds a standardized CloudIgniter error result.
 */
function ciDynamodbError(
  statusCode: CiErrorStatus,
  message: string,
  details?: CiJsonValue,
): CiResult<never, CiErrorBody, 200, CiErrorStatus> {
  return {
    ok: false,
    statusCode,
    body: {
      error: message,
      details,
    },
  };
}

/**
 * Builds a standardized "client not initialized" result.
 */
function ciClientNotInitializedResult<T>(): T {
  return {
    ok: false,
    statusCode: 500,
    body: {
      error:
        "DynamoDB client is not initialized. Call initialize() successfully before invoking this operation.",
    },
  } as T;
}

/**
 * CloudIgniter DynamoDB wrapper.
 *
 * Lifecycle:
 * - Call `await initialize()` once
 * - Reuse the same instance afterwards
 * - Call `destroy()` when deterministic teardown is desired
 */
export class Dynamodb {
  /**
   * Low-level DynamoDB client.
   */
  private dynamodbClient?: DynamoDBClient;

  /**
   * High-level DynamoDB DocumentClient used by all operations.
   */
  public client?: DynamoDBDocumentClient;

  /**
   * Base configuration used to construct the low-level DynamoDB client.
   */
  public readonly clientConfig: DynamoDBClientConfig;

  /**
   * @param clientConfig Base DynamoDB client configuration.
   */
  constructor(clientConfig: DynamoDBClientConfig = {}) {
    this.clientConfig = clientConfig;
  }

  /**
   * Initializes and caches the DynamoDB DocumentClient.
   */
  async initialize(): Promise<CiDynamodbInitializeResult> {
    if (this.client) {
      return {
        ok: true,
        statusCode: 200,
        body: {
          client: this.client,
        },
      };
    }

    if (ciInLambda()) {
      try {
        this.dynamodbClient = new DynamoDBClient(this.clientConfig);

        this.client = DynamoDBDocumentClient.from(this.dynamodbClient, {
          marshallOptions: { removeUndefinedValues: true },
        });

        return {
          ok: true,
          statusCode: 200,
          body: {
            client: this.client,
          },
        };
      } catch (error) {
        return ciDynamodbError(
          500,
          "Failed to initialize DynamoDB client inside Lambda runtime.",
          ciSerializeUnknownError(error),
        );
      }
    }

    try {
      const session = await fetchAuthSession();
      const credentials = session?.credentials;

      if (!credentials?.accessKeyId || !credentials?.secretAccessKey) {
        return ciDynamodbError(
          401,
          "Unable to initialize DynamoDB client because no valid Amplify AWS credentials were found.",
          {
            reason: "missingAmplifyCredentials",
          },
        );
      }

      this.dynamodbClient = new DynamoDBClient({
        ...this.clientConfig,
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          sessionToken: credentials.sessionToken,
        },
      });

      this.client = DynamoDBDocumentClient.from(this.dynamodbClient, {
        marshallOptions: { removeUndefinedValues: true },
      });

      return {
        ok: true,
        statusCode: 200,
        body: {
          client: this.client,
        },
      };
    } catch (error) {
      return ciDynamodbError(
        500,
        "Failed to initialize DynamoDB client from Amplify Auth session.",
        ciSerializeUnknownError(error),
      );
    }
  }

  /**
   * Explicitly releases underlying SDK resources.
   *
   * Notes:
   * - Safe to call multiple times
   * - Useful in tests, scripts, and long-lived Node.js processes
   */
  public destroy = (): void => {
    this.dynamodbClient?.destroy();
    this.client = undefined;
    this.dynamodbClient = undefined;
  };

  /**
   * Executes a single DynamoDB BatchWriteCommand.
   */
  public async batchWriteItems(
    requestItems: Record<string, CiBatchWriteRequest[]>,
  ): Promise<CiBatchWriteItemsResult> {
    if (!this.client) {
      return ciClientNotInitializedResult<CiBatchWriteItemsResult>();
    }

    return ciBatchWriteItemsFn(this.client, {
      RequestItems: requestItems,
    });
  }

  /**
   * Reads a single item using DynamoDB GetItem.
   *
   * @typeParam T Expected item shape
   * @typeParam K Primary key shape
   */
  public readItem = async <
    T extends Record<string, any>,
    K extends Record<string, any>,
  >(opts: {
    tableName: string;
    key: K;
    projection?: ProjectionInput;
    consistent?: boolean;
    metrics?: CiDynamoMetricsOption;
  }): Promise<ReadItemResult<T>> => {
    if (!this.client) {
      return ciClientNotInitializedResult<ReadItemResult<T>>();
    }

    return ciReadItemFn<T, K>(this.client, opts);
  };

  /**
   * Queries multiple items using DynamoDB QueryCommand.
   *
   * @typeParam T Expected item shape
   */
  public async queryItems<T extends Record<string, any> = Record<string, any>>(
    opts: QueryCommandInput,
  ): Promise<QueryItemsResult<T>> {
    if (!this.client) {
      return ciClientNotInitializedResult<QueryItemsResult<T>>();
    }

    return ciQueryItemsFn<T>(this.client, opts);
  }

  /**
   * Writes an item using DynamoDB PutItem or UpdateItem.
   */
  public async writeItem<
    I extends Record<string, any>,
    K extends Record<string, any>,
  >(
    opts: WriteItemOptions<I, K>,
  ): Promise<WriteItemResult<Record<string, any>>> {
    if (!this.client) {
      return ciClientNotInitializedResult<
        WriteItemResult<Record<string, any>>
      >();
    }

    return ciWriteItemFn<I, K>(this.client, opts);
  }

  /**
   * Deletes a single item using DynamoDB DeleteItem.
   *
   * @typeParam T Deleted item shape returned in `body.attributes`
   * @typeParam K Key shape passed in `opts.key`
   */
  public async deleteItem<
    T extends Record<string, any>,
    K extends Record<string, any>,
  >(opts: CiDeleteItemOptions<K>): Promise<CiDeleteItemResult<T>> {
    if (!this.client) {
      return ciClientNotInitializedResult<CiDeleteItemResult<T>>();
    }

    return ciDeleteItemFn<T, K>(this.client, opts);
  }

  /**
   * Executes a DynamoDB transaction using TransactWriteItems.
   */
  public async transactWrite(
    opts: CiTransactWriteOptions,
  ): Promise<CiTransactWriteResult> {
    if (!this.client) {
      return ciClientNotInitializedResult<CiTransactWriteResult>();
    }

    return ciTransactWriteFn(this.client, opts);
  }
}
