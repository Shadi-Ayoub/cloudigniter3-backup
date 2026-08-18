import {
  InvokeCommand,
  LambdaClient,
  type InvokeCommandOutput,
} from "@aws-sdk/client-lambda";

import type {
  CiBootstrapAccessControlInput,
  CiBootstrapAccessControlResult,
} from "./types";

function ciRequireNonEmptyString(value: string, field: string): string {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    throw new Error(`[ciBootstrapAccessControl] "${field}" must not be empty.`);
  }
  return normalizedValue;
}

function ciIsRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function ciParseBootstrapResponse(
  output: InvokeCommandOutput,
): Pick<CiBootstrapAccessControlResult, "created" | "revision"> {
  const text = output.Payload ? new TextDecoder().decode(output.Payload) : "";
  let payload: unknown;
  try {
    payload = text ? (JSON.parse(text) as unknown) : undefined;
  } catch {
    throw new Error(
      "[ciBootstrapAccessControl] The bootstrap Lambda returned invalid JSON.",
    );
  }

  if (output.FunctionError) {
    const message = ciIsRecord(payload)
      ? String(payload.errorMessage ?? payload.message ?? output.FunctionError)
      : output.FunctionError;
    throw new Error(`[ciBootstrapAccessControl] ${message}`);
  }
  if (!ciIsRecord(payload)) {
    throw new Error(
      "[ciBootstrapAccessControl] The bootstrap Lambda returned an invalid response.",
    );
  }
  const body = ciIsRecord(payload.body) ? payload.body : undefined;
  if (payload.ok !== true || !body) {
    const error = body?.error ?? payload.error;
    const details =
      body && ciIsRecord(body.details) ? body.details.message : undefined;
    throw new Error(
      `[ciBootstrapAccessControl] ${String(
        details ?? error ?? "The bootstrap Lambda reported a failure.",
      )}`,
    );
  }
  if (!ciIsRecord(body.definition)) {
    throw new Error(
      "[ciBootstrapAccessControl] The bootstrap Lambda returned no access-control definition.",
    );
  }

  const revision = body.revision;
  if (
    revision !== undefined &&
    (!Number.isSafeInteger(revision) || Number(revision) < 0)
  ) {
    throw new Error(
      "[ciBootstrapAccessControl] The bootstrap Lambda returned an invalid revision.",
    );
  }
  return {
    created: body.created === true,
    ...(revision === undefined ? {} : { revision: Number(revision) }),
  };
}

/**
 * Creates the canonical access-control state from Core defaults when absent.
 * Existing definitions are returned unchanged.
 */
export async function ciBootstrapAccessControl(
  input: CiBootstrapAccessControlInput,
  client?: Pick<LambdaClient, "send">,
): Promise<CiBootstrapAccessControlResult> {
  const region = ciRequireNonEmptyString(input.region, "region");
  const bootstrapFunctionName = ciRequireNonEmptyString(
    input.bootstrapFunctionName,
    "bootstrapFunctionName",
  );
  const accessControlTableName = ciRequireNonEmptyString(
    input.accessControlTableName,
    "accessControlTableName",
  );
  const lambdaClient = client ?? new LambdaClient({ region });
  const output = await lambdaClient.send(
    new InvokeCommand({
      FunctionName: bootstrapFunctionName,
      InvocationType: "RequestResponse",
      Payload: new TextEncoder().encode(
        JSON.stringify({ arguments: { inputString: "{}" } }),
      ),
    }),
  );
  const initialized = ciParseBootstrapResponse(output);

  return {
    accessControlTableName,
    created: initialized.created,
    ...(initialized.revision === undefined
      ? {}
      : { revision: initialized.revision }),
  };
}
