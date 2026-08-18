import path from "node:path";
import { pathToFileURL } from "node:url";

function ciReadOption(name) {
  const inline = process.argv.find((argument) =>
    argument.startsWith(`${name}=`),
  );
  if (inline) return inline.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function ciLoadResourceStudioDeploymentRuntime() {
  const [awsModule, localStoreModule, serviceModule] = await Promise.all([
    import("../../runtime/resource-studio/ci-resource-studio-aws.mjs"),
    import("../../runtime/resource-studio/ci-resource-studio-local-store.mjs"),
    import("../../runtime/resource-studio/ci-resource-studio-service.mjs"),
  ]);
  return {
    ciCreateResourceStudioAwsRuntime:
      awsModule.ciCreateResourceStudioAwsRuntime,
    ciCreateResourceStudioLocalStore:
      localStoreModule.ciCreateResourceStudioLocalStore,
    ciCreateResourceStudioService: serviceModule.ciCreateResourceStudioService,
    ciInspectResourceStudioNodeRuntime:
      awsModule.ciInspectResourceStudioNodeRuntime,
  };
}

function ciAssertExplicitOption(value, optionName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Amplify sandbox deployment requires ${optionName}.`);
  }
  return value;
}

function ciAssertDeployNodeRuntime(inspectRuntime, nodeVersion) {
  const runtime = inspectRuntime(nodeVersion);
  if (runtime.supported) return;
  const error = new Error(
    `Amplify deployment is disabled under Node.js ${runtime.version}. Use a supported Node LTS (${runtime.supportedMajors.join(", ")}) before running this command.`,
  );
  error.code = "CI_RESOURCE_STUDIO_UNSUPPORTED_NODE_RUNTIME";
  throw error;
}

export async function ciRunAmplifySandboxDeploy({
  applicationRoot,
  profile,
  identifier,
  nodeVersion = process.versions.node,
  loadRuntime = ciLoadResourceStudioDeploymentRuntime,
  writeOutput = (message) => console.log(message),
}) {
  const selectedProfile = ciAssertExplicitOption(
    profile,
    "an explicit AWS profile",
  );
  const sandboxIdentifier = ciAssertExplicitOption(
    identifier,
    "an explicit sandbox identifier",
  );
  const runtime = await loadRuntime();

  // This guard deliberately precedes local-state initialization and every AWS call.
  ciAssertDeployNodeRuntime(
    runtime.ciInspectResourceStudioNodeRuntime,
    nodeVersion,
  );

  const root = path.resolve(applicationRoot);
  const service = await runtime.ciCreateResourceStudioService({
    applicationRoot: root,
  });
  const localStore = await runtime.ciCreateResourceStudioLocalStore({
    applicationRoot: service.applicationRoot,
  });
  const awsRuntime = runtime.ciCreateResourceStudioAwsRuntime({
    applicationRoot: service.applicationRoot,
    localStore,
  });
  const planHash = await service.getDeploymentPlanHash();
  const preflight = await awsRuntime.preflight({
    profile: selectedProfile,
    identifier: sandboxIdentifier,
    planHash,
  });

  writeOutput(`AWS account: ${preflight.account}`);
  writeOutput(`AWS ARN: ${preflight.arn}`);
  writeOutput(`AWS region: ${preflight.region}`);

  const deployPlanHash = await service.getDeploymentPlanHash();
  const result = await awsRuntime.deploy({
    profile: selectedProfile,
    identifier: sandboxIdentifier,
    planHash: deployPlanHash,
    intentId: preflight.intentId,
  });
  writeOutput(
    `Amplify sandbox ${result.identifier} completed with profile ${result.profile}.`,
  );
  return result;
}

const isDirectInvocation =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectInvocation) {
  await ciRunAmplifySandboxDeploy({
    applicationRoot: ciReadOption("--app-root") ?? process.cwd(),
    profile: ciReadOption("--profile"),
    identifier: ciReadOption("--identifier"),
  });
}
