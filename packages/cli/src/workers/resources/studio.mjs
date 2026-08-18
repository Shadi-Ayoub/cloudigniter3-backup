import path from "node:path";

import { execa } from "execa";

import { ciCreateResourceStudioAwsRuntime } from "../../runtime/resource-studio/ci-resource-studio-aws.mjs";
import { ciCreateResourceStudioLocalStore } from "../../runtime/resource-studio/ci-resource-studio-local-store.mjs";
import { ciCreateResourceStudioService } from "../../runtime/resource-studio/ci-resource-studio-service.mjs";
import { ciStartResourceStudioServer } from "../../runtime/resource-studio/ci-resource-studio-server.mjs";

function ciReadOption(name) {
  const inline = process.argv.find((argument) =>
    argument.startsWith(`${name}=`),
  );
  if (inline) return inline.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function ciOpenBrowser(url) {
  if (process.platform === "darwin") {
    await execa("open", [url], { stdio: "ignore" });
    return;
  }
  if (process.platform === "win32") {
    await execa("cmd.exe", ["/d", "/s", "/c", "start", "", url], {
      stdio: "ignore",
    });
    return;
  }
  await execa("xdg-open", [url], { stdio: "ignore" });
}

const applicationRoot = path.resolve(
  ciReadOption("--app-root") ?? process.cwd(),
);
const profile = ciReadOption("--profile");
const identifier = ciReadOption("--identifier");
const portValue = ciReadOption("--port") ?? "0";
const port = Number(portValue);
const shouldOpen = !process.argv.includes("--no-open");

if (!Number.isInteger(port) || port < 0 || port > 65_535) {
  throw new Error(
    'The "--port" option must be an integer from 0 through 65535.',
  );
}

const service = await ciCreateResourceStudioService({ applicationRoot });
const localStore = await ciCreateResourceStudioLocalStore({
  applicationRoot: service.applicationRoot,
});
if (profile || identifier) {
  const current = await localStore.readSettings();
  await localStore.updateSettings({
    ...current,
    ...(profile ? { profile } : {}),
    ...(identifier ? { sandboxIdentifier: identifier } : {}),
  });
}
const awsRuntime = ciCreateResourceStudioAwsRuntime({
  applicationRoot: service.applicationRoot,
  localStore,
});

let resolveShutdown;
const shutdown = new Promise((resolve) => {
  resolveShutdown = resolve;
});
const studio = await ciStartResourceStudioServer({
  service,
  awsRuntime,
  localStore,
  port,
  onShutdown: () => resolveShutdown(),
});

await localStore.appendLog({
  type: "studio-lifecycle",
  status: "started",
  message: `Resource Studio started on localhost port ${studio.port}.`,
});

console.log(`Resource Studio is ready at ${studio.url}`);
console.log(
  "Edits remain offline until you explicitly run the one-shot sandbox action.",
);
console.log(
  "Press Ctrl+C or use Close Studio in the browser when you are finished.",
);

if (shouldOpen) {
  try {
    await ciOpenBrowser(studio.url);
  } catch (error) {
    console.warn(`Could not open the browser automatically: ${error.message}`);
  }
}

let stopping = false;
const stop = async (signal) => {
  if (stopping) return;
  stopping = true;
  await localStore.appendLog({
    type: "studio-lifecycle",
    status: "stopped",
    message: `Resource Studio stopped${signal ? ` after ${signal}` : ""}.`,
  });
  await studio.close();
  resolveShutdown();
};
process.once("SIGINT", () => void stop("SIGINT"));
process.once("SIGTERM", () => void stop("SIGTERM"));

await shutdown;
await stop();
