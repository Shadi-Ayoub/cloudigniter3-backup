import path from "node:path";
import { lstat, readFile, readdir, realpath } from "node:fs/promises";
import { isIP } from "node:net";
import { fileURLToPath } from "node:url";
import { ciAssertDeveloperWorkspace } from "./maintainer-runtime.mjs";
import { ciAssertCommandFlags } from "./maintainer-cli.mjs";
import { ciIsRecord } from "./policy.mjs";
import { ciReadRepositories } from "./repositories.mjs";
import {
  ciPublisherPath,
  ciValidatePublisherMetadata,
} from "./publisher-workspace.mjs";
import { CiDevUsageError } from "./runtime.mjs";
import {
  ciRunWorkspaceServer,
  ciOpenWorkspaceTerminal,
} from "./workspace-runtime.mjs";

/** @typedef {{mode?:string,port?:number,host?:string,open?:boolean,dryRun?:boolean,json?:boolean,external?:boolean,workspaceRoot?:string}} WorkspaceFlags */
/** @typedef {{kind:'server',workspaceRoot:string,target:string,framework:'next'|'docusaurus'|'static',mode:'dev'|'prod',cwd:string,port:number,host:string,url:string,command:string,args:string[],open:boolean}} WorkspaceStartPlan */
/** @typedef {{kind:'terminal',workspaceRoot:string,cwd:string,terminal:'integrated'|'external',package?:string,target?:string}} WorkspaceTerminalPlan */

/** @type {Record<string,{id:string,fallback:string,port:number}>} */
const workspaceProjects = {
  docs: { id: "cloudigniter-docs", fallback: "docs", port: 3010 },
  template: {
    id: "cloudigniter-next-aws-v1",
    fallback: "apps/template",
    port: 3000,
  },
  jodaris: { id: "jodaris-website", fallback: "apps/jodaris", port: 3001 },
  cloudigniter: {
    id: "cloudigniter-website",
    fallback: "apps/cloudigniter.io",
    port: 3002,
  },
};

export const ciWorkspaceCommands = {
  "open terminal":
    "Open a terminal at a registered package, app or Docs root, or the invoking directory.",
  "start docs": "Start the Docs website (port 3010).",
  "start template": "Start the Next.js template (port 3000).",
  "start website cloudigniter":
    "Start the CloudIgniter website (port 3002), when present.",
  "start website jodaris": "Start the JODARIS website (port 3001).",
};

export const ciWorkspaceHelp = `
  Workspace convenience
    dev start docs [--port=3010] [--mode=dev|prod] [--no-open]
    dev start template [--port=3000] [--mode=dev|prod] [--no-open]
    dev start website jodaris [--port=3001] [--mode=dev|prod] [--no-open]
    dev start website cloudigniter [--port=3002] [--mode=dev|prod] [--no-open]
    dev open terminal [<target>] [--external]
    Targets include packages, docs, template, jodaris and cloudigniter.
    --host=<IP|localhost>  Bind a website (default: 127.0.0.1).
    --mode=prod            Serve an existing build; never builds implicitly.
    --no-open              Print the website URL without opening the browser.
    --external             Open a new system terminal window instead of a VS Code terminal.
    Terminal default: a new VS Code integrated terminal; the invoking terminal stays available.
    DEV installs its bundled VS Code terminal helper on first use. No marketplace download.
    --dry-run [--json]      Preview the resolved target without starting/opening anything.
    These commands require the invoking directory to be inside the monorepo.
    --workspace-root cannot bypass this requirement. Ctrl+C stops a started website.
`;

/** @param {string} root @param {string} relative */
async function optionalJson(root, relative) {
  try {
    const value = JSON.parse(
      await readFile(await ciPublisherPath(root, relative), "utf8"),
    );
    if (!ciIsRecord(value))
      throw new CiDevUsageError(`${relative} must contain an object.`);
    return value;
  } catch (error) {
    if (ciIsRecord(error) && error.code === "ENOENT") return undefined;
    if (error instanceof SyntaxError)
      throw new CiDevUsageError(`Invalid JSON in ${relative}.`);
    throw error;
  }
}

/** @param {string} root @param {string} target */
async function projectPath(root, target) {
  const selected = workspaceProjects[target];
  if (!selected)
    throw new CiDevUsageError("Unknown workspace website. Run dev --help.");
  let sourcePath;
  if (await optionalJson(root, ".cloudigniter/repositories.json"))
    sourcePath = (await ciReadRepositories(root)).projects[selected.id]
      ?.sourcePath;
  return { relative: sourcePath ?? selected.fallback, port: selected.port };
}

/** @param {string} root @param {string} subject */
async function targetDirectory(root, subject) {
  if (
    !/^(?:@cloudigniter\/|(?:packages|apps)\/)?[a-z0-9][a-z0-9._-]*$/.test(
      subject,
    )
  )
    throw new CiDevUsageError(
      "Select a registered workspace name such as core, docs or cloudigniter; directory traversal is not accepted.",
    );
  const repositories = (await optionalJson(
    root,
    ".cloudigniter/repositories.json",
  ))
    ? await ciReadRepositories(root)
    : undefined;
  /** @type {Map<string,Set<string>>} */ const directories = new Map();
  /** @param {string} relative @param {string} [alias] */
  const register = (relative, alias) => {
    const aliases =
      directories.get(relative) ??
      new Set([relative, path.posix.basename(relative)]);
    if (alias) aliases.add(alias);
    directories.set(relative, aliases);
  };
  for (const [name, project] of Object.entries(workspaceProjects))
    register(
      repositories?.projects[project.id]?.sourcePath ?? project.fallback,
      name,
    );
  for (const [id, project] of Object.entries(repositories?.projects ?? {}))
    if (project.sourcePath) register(project.sourcePath, id);
  for (const parent of ["packages", "apps"]) {
    try {
      for (const entry of await readdir(await ciPublisherPath(root, parent), {
        withFileTypes: true,
      }))
        if (entry.isDirectory()) register(`${parent}/${entry.name}`);
    } catch (error) {
      if (!(ciIsRecord(error) && error.code === "ENOENT")) throw error;
    }
  }
  /** @type {{relative:string,package?:string}[]} */ const matches = [];
  for (const [relative, aliases] of directories) {
    const manifest = await optionalJson(root, `${relative}/package.json`);
    const rawMetadata = await optionalJson(
      root,
      `${relative}/publisher.config.json`,
    );
    const metadata = rawMetadata
      ? ciValidatePublisherMetadata(rawMetadata)
      : undefined;
    const name = typeof manifest?.name === "string" ? manifest.name : undefined;
    if (
      relative.startsWith("packages/")
        ? !name?.startsWith("@cloudigniter/")
        : !name && !metadata?.label
    )
      continue;
    if (name) {
      aliases.add(name);
      aliases.add(name.replace(/^@cloudigniter\//, ""));
    }
    if (metadata?.workspaceName) aliases.add(metadata.workspaceName);
    if (aliases.has(subject))
      matches.push({
        relative,
        ...(relative.startsWith("packages/") && name ? { package: name } : {}),
      });
  }
  if (matches.length > 1)
    throw new CiDevUsageError(
      `Ambiguous workspace target "${subject}": ${matches.map((m) => m.relative).join(", ")}. Use an explicit registered path.`,
    );
  const selected = matches[0];
  if (!selected)
    throw new CiDevUsageError(
      `Workspace target "${subject}" is not registered or not present. Select a package, an app with package.json or publisher.config.json, or docs.`,
    );
  return {
    cwd: await ciPublisherPath(root, selected.relative),
    target: subject,
    ...(selected.package ? { package: selected.package } : {}),
  };
}

/** Resolve first, without processes, browser launches, directory changes or writes.
 * @param {string[]} input @param {WorkspaceFlags} [flags] @param {string} [cwd] @param {string[]} [argv]
 * @returns {Promise<WorkspaceStartPlan|WorkspaceTerminalPlan>}
 */
export async function ciCreateWorkspacePlan(
  input,
  flags = {},
  cwd = process.cwd(),
  argv = [],
) {
  const terminal =
    input[0] === "open" && input[1] === "terminal" && input.length <= 3;
  const target = input[1] === "website" ? input[2] : input[1];
  const key = terminal ? "open terminal" : input.join(" ");
  if (!Object.hasOwn(ciWorkspaceCommands, key))
    throw new CiDevUsageError("Unknown workspace command. Run dev --help.");
  ciAssertCommandFlags(
    argv,
    terminal
      ? ["external", "dry-run", "json"]
      : ["mode", "host", "port", "open", "dry-run", "json"],
  );
  if (flags.workspaceRoot !== undefined)
    throw new CiDevUsageError(
      "Workspace convenience commands discover from the invoking directory; omit --workspace-root.",
    );
  if (flags.json && !flags.dryRun)
    throw new CiDevUsageError("Workspace --json output requires --dry-run.");
  let root;
  try {
    root = await ciAssertDeveloperWorkspace(cwd);
  } catch (error) {
    if (error instanceof CiDevUsageError)
      throw new CiDevUsageError(
        "This command requires an invoking directory inside the CloudIgniter Workspace (private monorepo). Open its root or any nested directory first.",
      );
    throw error;
  }
  if (terminal)
    return {
      kind: "terminal",
      workspaceRoot: root,
      terminal: flags.external ? "external" : "integrated",
      ...(input[2]
        ? await targetDirectory(root, input[2])
        : { cwd: await realpath(cwd) }),
    };
  const selected = await projectPath(root, target ?? "");
  let directory;
  try {
    directory = await ciPublisherPath(root, selected.relative);
    if (!(await lstat(directory)).isDirectory())
      throw new Error("Not a directory");
  } catch (error) {
    if (ciIsRecord(error) && error.code === "ENOENT")
      throw new CiDevUsageError(
        `The ${target} website is not present (${selected.relative}). Add its application, or configure its sourcePath in .cloudigniter/repositories.json.`,
      );
    throw error;
  }
  const port = flags.port ?? selected.port;
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new CiDevUsageError("--port must be an integer between 1 and 65535.");
  const host = flags.host ?? "127.0.0.1";
  if (host !== "localhost" && !isIP(host))
    throw new CiDevUsageError("--host must be an IP address or localhost.");
  const mode = flags.mode ?? "dev";
  if (mode !== "dev" && mode !== "prod")
    throw new CiDevUsageError("--mode must be dev or prod.");
  const manifest = await optionalJson(
    root,
    `${selected.relative}/package.json`,
  );
  const metadataValue = await optionalJson(
    root,
    `${selected.relative}/publisher.config.json`,
  );
  const metadata = metadataValue
    ? ciValidatePublisherMetadata(metadataValue)
    : undefined;
  const dependencies = {
    ...(ciIsRecord(manifest?.devDependencies) ? manifest.devDependencies : {}),
    ...(ciIsRecord(manifest?.dependencies) ? manifest.dependencies : {}),
  };
  const framework =
    target === "docs" && dependencies["@docusaurus/core"]
      ? "docusaurus"
      : dependencies.next
        ? "next"
        : metadata?.staticHosting === true
          ? "static"
          : undefined;
  if (!framework)
    throw new CiDevUsageError(
      `${selected.relative} is not a runnable ${target === "docs" ? "Docusaurus" : "Next.js or explicitly static"} website.`,
    );
  let command = "pnpm";
  let args;
  if (framework === "static") {
    const publicDirectory =
      mode === "dev"
        ? selected.relative
        : `${selected.relative}/${metadata?.buildDirectories?.[0] ?? "dist"}`;
    try {
      await ciPublisherPath(root, `${publicDirectory}/index.html`);
    } catch (error) {
      if (ciIsRecord(error) && error.code === "ENOENT")
        throw new CiDevUsageError(
          `Missing ${publicDirectory}/index.html. ${mode === "prod" ? "Build the static site before using --mode=prod." : "Restore the static site's index.html."}`,
        );
      throw error;
    }
    command = process.execPath;
    args = [
      fileURLToPath(new URL("./workspace-static.mjs", import.meta.url)),
      path.join(root, publicDirectory),
      host,
      String(port),
    ];
  } else {
    const script =
      framework === "docusaurus"
        ? mode === "dev"
          ? "start"
          : "serve"
        : mode === "dev"
          ? "dev"
          : "start";
    if (
      !ciIsRecord(manifest?.scripts) ||
      typeof manifest.scripts[script] !== "string" ||
      !manifest.scripts[script].trim()
    )
      throw new CiDevUsageError(
        `Define the ${script} script in ${selected.relative}/package.json.`,
      );
    if (framework === "docusaurus" && mode === "prod") {
      try {
        await ciPublisherPath(root, `${selected.relative}/build/index.html`);
      } catch (error) {
        if (ciIsRecord(error) && error.code === "ENOENT")
          throw new CiDevUsageError(
            "Build Docs first (pnpm --filter docs build) before using --mode=prod.",
          );
        throw error;
      }
    }
    args = [
      "run",
      script,
      "--port",
      String(port),
      framework === "next" ? "--hostname" : "--host",
      host,
    ];
    if (framework === "docusaurus") args.push("--no-open");
  }
  const urlHost =
    host === "0.0.0.0" ? "127.0.0.1" : host === "::" ? "::1" : host;
  return {
    kind: "server",
    workspaceRoot: root,
    target: target ?? "",
    framework,
    mode,
    cwd: directory,
    port,
    host,
    url: `http://${isIP(urlHost) === 6 ? `[${urlHost}]` : urlHost}:${port}/`,
    command,
    args,
    open: flags.open !== false,
  };
}

/** @param {string[]} input @param {WorkspaceFlags} flags @param {string[]} argv */
export async function ciRunWorkspaceCommand(input, flags, argv) {
  const plan = await ciCreateWorkspacePlan(input, flags, process.cwd(), argv);
  if (flags.dryRun) {
    console.log(
      flags.json
        ? JSON.stringify(plan, null, 2)
        : `Workspace preview: ${plan.kind === "terminal" ? "terminal" : `${plan.target} (${plan.mode})`}\nDirectory: ${plan.cwd}${plan.kind === "server" ? `\nURL: ${plan.url}\nCommand: ${plan.command} ${plan.args.join(" ")}` : ""}`,
    );
    return;
  }
  if (plan.kind === "terminal") await ciOpenWorkspaceTerminal(plan);
  else await ciRunWorkspaceServer(plan);
}
