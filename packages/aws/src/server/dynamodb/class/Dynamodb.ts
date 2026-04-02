import {
  DynamoDBClient,
  type DynamoDBClientConfig,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  type QueryCommandInput,
  type QueryCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import { fetchAuthSession } from "aws-amplify/auth";

import type {
  CiErrorBody,
  CiErrorStatus,
  CiJsonValue,
  CiResult,
} from "@cloudigniter/core";

import {
  readItem as readItemFn,
  type MetricsOption,
  type ProjectionInput,
  type ReadItemResult,
} from "./ci-read-dynamodb-item";
import {
  queryItems as queryItemsFn,
  type QueryItemsResult,
} from "./ci-query-dynamodb-items";
import {
  writeItem as writeItemFn,
  type WriteItemOptions,
  type WriteItemResult,
} from "./ci-write-dynamodb-item";
import {
  deleteItem as deleteItemFn,
  type CiDeleteItemResult,
  type MetricsOption as DeleteMetricsOption,
} from "./ci-delete-dynamodb-item";
import {
  transactWrite as transactWriteFn,
  type TransactWriteOp,
  type TransactWriteResult,
} from "./ci-transact-dynamodb-write";
import { batchWriteItems as batchWriteItemsFn } from "./ci-batch-write-dynamodb-items";

import type { CiBatchWriteItemsResult, CiBatchWriteRequest } from "../types";

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
 * Success result for `queryItems()`.
 */
export type QueryItemsOkResult<T = Record<string, any>> = {
  ok: true;
  items: T[];
  count?: number;
  scannedCount?: number;
  lastEvaluatedKey?: Record<string, any>;
  consumedCapacity?: QueryCommandOutput["ConsumedCapacity"];
  metadata: QueryCommandOutput["$metadata"];
  warnings?: string[];
};

/**
 * Error result for `queryItems()`.
 */
export type QueryItemsErrResult = {
  ok: false;
  statusCode: CiErrorStatus;
  error: string;
  originalError?: unknown;
};

/**
 * Detects whether this code is currently executing inside an AWS Lambda runtime.
 *
 * Why it matters:
 * - In Lambda, the AWS SDK default credential provider chain will automatically
 *   use the function's execution role.
 * - Outside Lambda, CloudIgniter commonly relies on Amplify Auth session credentials.
 */
function inLambda(): boolean {
  return Boolean(
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
      (process.env.AWS_EXECUTION_ENV &&
        process.env.AWS_EXECUTION_ENV.startsWith("AWS_Lambda_")),
  );
}

/**
 * Converts unknown thrown values into a JSON-safe details payload.
 *
 * This avoids passing raw `unknown` objects into `CiErrorBody.details`.
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
  if (typeof error === "number" || typeof error === "boolean" || error === null)
    return error;

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
 *
 * This is intentionally returned instead of throwing so the class remains
 * fully Result-based.
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
 * Purpose:
 * - Provide a thin, reusable entry point for obtaining a configured
 *   `DynamoDBDocumentClient`.
 * - Unify client initialization for two common execution contexts:
 *   1) AWS Lambda
 *   2) Non-Lambda with Amplify Auth session credentials
 * - Expose convenience methods that delegate to focused helper modules.
 *
 * Important design rule:
 * - This class does not throw for expected operational failures.
 * - Public methods return Result-style objects so callers can branch on `ok`.
 *
 * Lifecycle:
 * - Call `await initialize()` once.
 * - Reuse the same instance afterwards.
 * - Call `destroy()` when deterministic teardown is desired.
 */
export class Dynamodb {
  /**
   * Low-level DynamoDB client.
   * Stored so it can be explicitly destroyed later.
   */
  private dynamodbClient?: DynamoDBClient;

  /**
   * High-level DynamoDB DocumentClient used by all operations.
   */
  public client?: DynamoDBDocumentClient;

  /**
   * Base configuration used to construct the low-level DynamoDB client.
   */
  public clientConfig: DynamoDBClientConfig;

  /**
   * @param clientConfig Base DynamoDB client configuration.
   */
  constructor(clientConfig: DynamoDBClientConfig) {
    this.clientConfig = clientConfig;
  }

  /**
   * Initializes and caches the DynamoDB DocumentClient.
   *
   * Behavior:
   * - Returns the cached client when already initialized.
   * - In Lambda, uses the default AWS credential provider chain.
   * - Outside Lambda, attempts to use credentials from Amplify Auth session.
   *
   * Result semantics:
   * - Success:
   *   `{ ok: true, statusCode: 200, body: { client } }`
   * - Failure:
   *   `{ ok: false, statusCode, body: { error, details? } }`
   *
   * This method does not throw for normal operational failures.
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

    if (inLambda()) {
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

      const credentialsObj = {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken,
      };

      this.dynamodbClient = new DynamoDBClient({
        ...this.clientConfig,
        credentials: credentialsObj,
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
   * - Safe to call multiple times.
   * - Useful in tests, scripts, and long-lived node processes.
   */
  public destroy = (): void => {
    this.client?.destroy();
    this.dynamodbClient?.destroy();
    this.client = undefined;
    this.dynamodbClient = undefined;
  };

  public async batchWriteItems(
    requestItems: Record<string, CiBatchWriteRequest[]>,
  ): Promise<CiBatchWriteItemsResult> {
    if (!this.client) {
      return ciClientNotInitializedResult<CiBatchWriteItemsResult>();
    }

    return batchWriteItemsFn(this.client, {
      RequestItems: requestItems,
    });
  }

  /**
   * Reads a single item using the helper `readItem()` (GetItem).
   *
   * Requires:
   * - `await initialize()` must have succeeded first.
   *
   * @typeParam T Expected item shape.
   * @typeParam K Primary key shape.
   */
  public readItem = async <
    T extends Record<string, any>,
    K extends Record<string, any>,
  >(opts: {
    tableName: string;
    key: K;
    projection?: ProjectionInput;
    consistent?: boolean;
    metrics?: MetricsOption;
  }): Promise<ReadItemResult<T>> => {
    if (!this.client) {
      return ciClientNotInitializedResult<ReadItemResult<T>>();
    }

    return readItemFn<T, K>(this.client, opts);
  };

  /**
   * Queries multiple items using DynamoDB `QueryCommand`.
   *
   * Typical use cases:
   * - fetching all items within the same partition key
   * - fetching descendants in a path-based hierarchy with `begins_with`
   * - paginated reads using `LastEvaluatedKey`
   *
   * Requires:
   * - `await initialize()` must have succeeded first.
   *
   * @typeParam T Expected item shape.
   */
  public async queryItems<T extends Record<string, any> = Record<string, any>>(
    opts: QueryCommandInput,
  ): Promise<QueryItemsResult<T>> {
    if (!this.client) {
      return ciClientNotInitializedResult<QueryItemsResult<T>>();
    }

    return queryItemsFn<T>(this.client, opts);
  }

  /**
   * Writes an item using the helper `writeItem()` (PutItem or UpdateItem).
   *
   * Supports:
   * - mode: auto / put / update
   * - existence controls
   * - timestamps
   * - optimistic locking
   * - return values
   * - metrics
   *
   * Requires:
   * - `await initialize()` must have succeeded first.
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

    return writeItemFn<I, K>(this.client, opts);
  }

  /**
   * Deletes a single item using the helper `deleteItem()` (DeleteItem).
   *
   * Generic order matches `readItem<T, K>`:
   * - `T` = deleted item shape returned in `body.attributes`
   * - `K` = key shape passed in `opts.key`
   *
   * Supports:
   * - existence mode
   * - return values
   * - metrics
   *
   * Requires:
   * - `await initialize()` must have succeeded first.
   */
  public async deleteItem<
    T extends Record<string, any>,
    K extends Record<string, any>,
  >(opts: {
    tableName: string;
    key: K;
    existence?: "any" | "deleteOnly";
    returnValues?: "NONE" | "ALL_OLD";
    metrics?: DeleteMetricsOption;
  }): Promise<CiDeleteItemResult<T>> {
    if (!this.client) {
      return ciClientNotInitializedResult<CiDeleteItemResult<T>>();
    }

    return deleteItemFn<T, K>(this.client, opts);
  }

  /**
   * Executes a DynamoDB transaction using the helper `transactWrite()`.
   *
   * Notes:
   * - Current helper assumes a single-table workflow.
   * - Per-operation existence semantics are handled by the helper.
   *
   * Requires:
   * - `await initialize()` must have succeeded first.
   */
  public async transactWrite(opts: {
    tableName: string;
    items: TransactWriteOp[];
    returnConsumedCapacity?: "NONE" | "TOTAL" | "INDEXES";
  }): Promise<TransactWriteResult> {
    if (!this.client) {
      return ciClientNotInitializedResult<TransactWriteResult>();
    }

    return transactWriteFn(this.client, opts);
  }
}
