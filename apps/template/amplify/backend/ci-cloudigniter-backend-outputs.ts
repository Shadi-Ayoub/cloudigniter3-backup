type CiCloudIgniterBackendOutputsInput = {
  tableOutputs: Record<string, string>;
  emberguardAccessBootstrapFunctionName: string;
};

/** Builds the CloudIgniter section published to amplify_outputs.json. */
export function ciCreateCloudIgniterBackendOutputs(
  input: CiCloudIgniterBackendOutputsInput,
) {
  return {
    custom: {
      cloudigniter: {
        ...input.tableOutputs,
        emberguardAccessBootstrapFunctionName:
          input.emberguardAccessBootstrapFunctionName,
      },
    },
  };
}
