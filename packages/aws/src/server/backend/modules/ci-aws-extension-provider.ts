import {
  CreateStackCommand,
  DeleteStackCommand,
  DescribeStacksCommand,
} from "@aws-sdk/client-cloudformation";
import type { Stack } from "@aws-sdk/client-cloudformation";
import type {
  CiExtensionInstallation,
  CiExtensionProvider,
} from "@cloudigniter/core/types";
import type { CiAwsExtensionProviderOptions } from "@ci-aws/types";

/** Owns standalone extension stacks only. Never deletes an Amplify parent/nested stack. */
export function ciCreateAwsExtensionProvider(
  options: CiAwsExtensionProviderOptions,
): CiExtensionProvider {
  if (
    !/^ci-ext-[a-f0-9]{12}$/.test(options.prefix) ||
    !/^\d{12}$/.test(options.account) ||
    !options.region ||
    !options.partition ||
    !options.serviceRoleArn
  )
    throw new Error(
      "Module infrastructure is not configured for this environment.",
    );
  const name = (id: string) => `${options.prefix}-${id}`;
  function assertReference(record: CiExtensionInstallation) {
    const expected = name(record.manifest.id);
    const arnPrefix = `arn:${options.partition}:cloudformation:${options.region}:${options.account}:stack/${expected}/`;
    if (
      record.infrastructure.provider !== "aws" ||
      (record.infrastructure.id !== expected &&
        !record.infrastructure.id.startsWith(arnPrefix))
    )
      throw new Error(
        "Module stack ownership mismatch; no infrastructure was changed.",
      );
  }
  async function read(
    record: CiExtensionInstallation,
  ): Promise<Stack | undefined> {
    assertReference(record);
    try {
      const result = await options.client.send(
        new DescribeStacksCommand({ StackName: record.infrastructure.id }),
      );
      const stack = result.Stacks?.[0];
      if (!stack || stack.StackStatus === "DELETE_COMPLETE") return undefined;
      const arnPrefix = `arn:${options.partition}:cloudformation:${options.region}:${options.account}:stack/${name(record.manifest.id)}/`;
      if (
        !stack.StackId?.startsWith(arnPrefix) ||
        stack.StackName !== name(record.manifest.id) ||
        stack.ParentId ||
        stack.RootId ||
        !stack.Tags?.some(
          (tag) =>
            tag.Key === "CloudIgniterEnvironment" &&
            tag.Value === options.prefix,
        ) ||
        !stack.Tags.some(
          (tag) =>
            tag.Key === "CloudIgniterModule" &&
            tag.Value === record.manifest.id,
        )
      )
        throw new Error(
          "Module stack ownership mismatch; no infrastructure was changed.",
        );
      return stack;
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "ValidationError" &&
        /does not exist/.test(error.message)
      )
        return undefined;
      throw error;
    }
  }
  return {
    plan: (manifest) =>
      options.definitions.find((item) => item.manifest.id === manifest.id)
        ?.template
        ? { provider: "aws", id: name(manifest.id) }
        : { provider: "none", id: manifest.id },
    async install(record) {
      if (
        record.infrastructure.provider === "none" &&
        record.infrastructure.id === record.manifest.id
      )
        return;
      const existing = await read(record);
      if (existing) return; // Reconciliation reports terminal failure; never replace another stack.
      const definition = options.definitions.find(
        (item) =>
          item.manifest.id === record.manifest.id &&
          item.manifest.version === record.manifest.version,
      );
      if (!definition?.template)
        throw new Error("The installed module code is unavailable.");
      await options.client.send(
        new CreateStackCommand({
          StackName: name(record.manifest.id),
          TemplateBody: JSON.stringify(
            definition.template(name(record.manifest.id)),
          ),
          RoleARN: options.serviceRoleArn,
          ClientRequestToken: record.operationId,
          OnFailure: "ROLLBACK",
          Tags: [
            { Key: "CloudIgniterEnvironment", Value: options.prefix },
            { Key: "CloudIgniterModule", Value: record.manifest.id },
          ],
        }),
      );
    },
    async uninstall(record) {
      if (
        record.infrastructure.provider === "none" &&
        record.infrastructure.id === record.manifest.id
      )
        return;
      const stack = await read(record);
      if (!stack || stack.StackStatus === "DELETE_IN_PROGRESS") return;
      // The ARN comes from DescribeStacks after all ownership checks, never from a UI request.
      await options.client.send(
        new DeleteStackCommand({
          StackName: stack.StackId!,
          RoleARN: options.serviceRoleArn,
          ClientRequestToken: record.operationId,
        }),
      );
    },
    async inspect(record) {
      if (
        record.infrastructure.provider === "none" &&
        record.infrastructure.id === record.manifest.id
      )
        return {
          status: record.operation === "uninstall" ? "missing" : "ready",
        };
      const stack = await read(record);
      if (!stack) return { status: "missing" };
      const infrastructure = {
        provider: "aws",
        id: stack.StackId!,
        outputs: Object.fromEntries(
          (stack.Outputs ?? [])
            .filter((item) => item.OutputKey && item.OutputValue)
            .map((item) => [item.OutputKey!, item.OutputValue!]),
        ),
      };
      if (stack.StackStatus === "CREATE_COMPLETE")
        return { status: "ready", infrastructure };
      if (stack.StackStatus?.endsWith("_IN_PROGRESS"))
        return { status: "pending", infrastructure };
      return {
        status: "failed",
        infrastructure,
        error: `CloudFormation reported ${stack.StackStatus ?? "an unknown state"}. Inspect the module stack events, then retry removal.`,
      };
    },
  };
}
