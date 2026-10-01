import path from "node:path";
import { fileURLToPath } from "node:url";
import { ciPublisherPath } from "./publisher-workspace.mjs";
import { CiDevUsageError } from "./runtime.mjs";

const bin = fileURLToPath(new URL("../bin/dev.mjs", import.meta.url));
/** Common finite scripts only. Watch/server commands intentionally need a separate lifecycle. */
const scriptLabels = {
  test: "Run tests",
  typecheck: "Typecheck",
  "typecheck:tools": "Check tooling types",
  "typecheck:tests": "Check test types",
  check: "Run checks",
  quality: "Quality gate",
  "check:package": "Validate package",
  "release:check": "Release check",
  "test:coverage": "Test with coverage",
  lint: "Lint",
  "build:assets": "Build assets",
  "build:js": "Build JavaScript",
  "build:types": "Bundle declarations",
  "build:types:raw": "Emit declarations",
  "build:types:clean": "Clean temporary types",
  prepublishOnly: "Prepublish checks",
  obfuscate: "Obfuscate output",
  "test:style": "Check stylesheet",
  "build:theme": "Build theme",
  "scan:client-directives": "Scan client directives",
  "list:client-files": "List client files",
  "test:build-gate": "Test build gate",
  "clean:maps": "Remove source maps",
  "clean:dts": "Clean declarations",
  clean: "Clean build",
};
/** @param {import('./publisher-types.d.mts').PublisherTarget} target */
export function ciPublisherActions(target) {
  /** @type {import('./publisher-types.d.mts').PublisherAction[]} */ const actions =
    [];
  if (
    target.governedBuild ||
    target.scripts.build ||
    target.scripts["build:prod"] ||
    target.scripts["build:dev"]
  )
    actions.push({
      id: "build",
      label: "Build",
      group: "Build",
      fields: ["mode", ...(target.governedBuild ? ["obfuscation"] : [])],
    });
  for (const [id, label] of Object.entries(scriptLabels))
    if (target.scripts[id])
      actions.push({
        id: `script:${id}`,
        label,
        group:
          id.startsWith("build:") || id.startsWith("clean")
            ? "Build"
            : "Verify",
      });
  for (const mode of ["src", "dist"])
    if (target.scripts[`switch:${mode}`])
      actions.push({
        id: `switch:${mode}`,
        label: mode === "src" ? "Use source" : "Use distribution",
        group: "Exports",
      });
  for (const [id, cmd] of Object.entries(target.metadata.commands ?? {}))
    actions.push({ id: `custom:${id}`, label: cmd.label, group: "Project" });
  if (target.access && !target.private) {
    actions.push(
      {
        id: "npm:plan",
        label: "Preview release",
        group: "Publish",
        fields: ["intent", "summary", "tag", "preid"],
      },
      {
        id: "npm:publish",
        label: "Request source review",
        group: "Publish",
        fields: ["intent", "summary", "tag", "preid"],
        remote: true,
      },
      {
        id: "npm:status",
        label: "Request status",
        group: "Publish",
        fields: ["number"],
      },
      {
        id: "npm:version",
        label: "Apply approved versions",
        group: "Publish",
        fields: ["request", "dryRun"],
      },
      {
        id: "npm:candidate",
        label: "Build release candidate",
        group: "Publish",
        fields: ["request", "output"],
      },
      {
        id: "npm:deliver",
        label: "Request build review",
        group: "Publish",
        fields: ["manifest", "dryRun"],
        remote: true,
      },
    );
  }
  if (target.kind === "template")
    for (const [
      id,
      label,
      fields,
      remote,
    ] of /** @type {[string,string,string[],boolean][]} */ ([
      ["export", "Export template", ["output", "dryRun"], false],
      ["check", "Verify export", ["output"], false],
      [
        "publish",
        "Request template review",
        ["output", "summary", "dryRun"],
        true,
      ],
      ["status", "Template request status", ["number"], false],
      ["deliver", "Deliver approved template", ["number", "dryRun"], true],
    ]))
      actions.push({
        id: `template:${id}`,
        label,
        fields,
        remote,
        group: "Publish",
      });
  if (target.projectId) {
    actions.push(
      {
        id: "github:repo",
        label: "Repository details",
        group: "GitHub",
        fields: ["repositoryKind"],
      },
      {
        id: "github:runs",
        label: "Actions runs",
        group: "GitHub",
        fields: ["repositoryKind"],
      },
      {
        id: "github:workflows",
        label: "Workflows",
        group: "GitHub",
        fields: ["repositoryKind"],
      },
    );
    if (target.kind === "package" || target.metadata.staticHosting)
      actions.push({
        id: "github:scaffold",
        label: "Generate delivery workflow",
        group: "Publish",
        fields: ["output"],
        description:
          "Writes workflow files to a new external directory; review and commit them in the build repository.",
      });
  }
  return actions;
}
/** @param {unknown} input @param {string} name @param {boolean} [optional] */
function field(input, name, optional = false) {
  if (optional && (input === undefined || input === "")) return "";
  if (
    typeof input !== "string" ||
    !input.trim() ||
    /[\x00-\x1f]/.test(input) ||
    input.length > 4000
  )
    throw new CiDevUsageError(`Enter a valid ${name}.`);
  return input.trim();
}
/** @param {string} value @param {string[]} choices */
function choice(value, choices) {
  if (!choices.includes(value))
    throw new CiDevUsageError(`Expected one of: ${choices.join(", ")}.`);
  return value;
}

/** Re-resolved on every preview and execution. Never accepts a browser-supplied executable.
 * @param {string} root @param {import('./publisher-types.d.mts').PublisherTarget} target
 * @param {string} id @param {Record<string,unknown>} input @param {string|null} profile
 * @returns {Promise<import('./publisher-types.d.mts').PublisherPlan>}
 */
export async function ciPublisherPlan(root, target, id, input, profile) {
  const action = ciPublisherActions(target).find((a) => a.id === id);
  if (!action || target.warnings.length)
    throw new CiDevUsageError(
      "This action is unavailable. Check the target configuration.",
    );
  if (Object.keys(input).some((k) => !action.fields?.includes(k)))
    throw new CiDevUsageError("Unsupported action option.");
  if (input.dryRun !== undefined && typeof input.dryRun !== "boolean")
    throw new CiDevUsageError("dryRun must be boolean.");
  const cwd = await ciPublisherPath(root, target.id);
  /** @type {import('./publisher-types.d.mts').PublisherCommand[]} */ const commands =
    [];
  /** @param {string[]} args @param {string} [directory] */
  const dev = (args, directory = root) =>
    commands.push({
      command: process.execPath,
      args: [
        bin,
        ...args,
        "--no-interactive",
        `--workspace-root=${root}`,
        ...(profile ? [`--profile=${profile}`] : []),
      ],
      cwd: directory,
    });
  // Local package commands do not accept a GitHub profile.
  /** @param {string[]} args */
  const localDev = (args) =>
    commands.push({
      command: process.execPath,
      args: [bin, ...args, "--no-interactive", `--workspace-root=${root}`],
      cwd,
    });
  /** @param {string} script */
  const script = (script) => {
    if (!target.scripts[script])
      throw new CiDevUsageError("No matching script is configured.");
    commands.push({ command: "pnpm", args: ["run", script], cwd });
  };
  if (id === "build") {
    const mode = choice(field(input.mode ?? "prod", "build mode"), [
      "dev",
      "prod",
    ]);
    if (target.governedBuild)
      localDev([
        "package",
        "build",
        `--mode=${mode}`,
        `--obfuscation=${choice(field(input.obfuscation ?? "configured", "obfuscation"), ["configured", "on", "off"])}`,
      ]);
    else {
      const name = target.scripts[`build:${mode}`]
        ? `build:${mode}`
        : mode === "prod" && target.scripts.build
          ? "build"
          : "";
      if (!name)
        throw new CiDevUsageError(
          "No development build script is configured. Add build:dev or select production.",
        );
      script(name);
    }
  } else if (id.startsWith("script:")) script(id.slice(7));
  else if (id.startsWith("switch:")) script(id);
  else if (id.startsWith("custom:")) {
    const cmd = target.metadata.commands?.[id.slice(7)];
    if (!cmd) throw new CiDevUsageError("Missing explicit command.");
    if (cmd.command === "pnpm") script(cmd.args[1] ?? "");
    else {
      await ciPublisherPath(cwd, cmd.args[0] ?? "");
      commands.push({
        command: cmd.command === "node" ? process.execPath : cmd.command,
        args: [...cmd.args],
        cwd,
      });
    }
  } else if (id.startsWith("npm:")) {
    const verb = id.slice(4),
      args = ["npm", verb];
    if (verb === "plan" || verb === "publish") {
      const intent = choice(field(input.intent ?? "fix", "release intent"), [
        "fix",
        "feature",
        "breaking",
        "patch",
        "minor",
        "major",
        "initial",
        "changed",
      ]);
      if (intent === "changed") args.push("--changed");
      else args.push(intent, `--package=${target.name}`);
      const summary = field(
        input.summary,
        "summary",
        verb === "plan" || intent === "changed",
      );
      if (summary) args.push(`--summary=${summary}`);
      for (const key of ["tag", "preid"]) {
        const value = field(input[key], key, true);
        if (value) args.push(`--${key}=${value}`);
      }
    } else if (verb === "status") {
      args.push(
        field(input.number, "request number"),
        `--package=${target.name}`,
      );
    } else if (verb === "version" || verb === "candidate") {
      const request = field(input.request, "release request ID");
      if (!/^[a-f0-9]{24}$/.test(request))
        throw new CiDevUsageError(
          "Release request ID must contain 24 hexadecimal characters.",
        );
      args.push(`--request=${request}`);
      if (verb === "candidate")
        args.push(
          `--output=${field(input.output, "new external output directory")}`,
        );
    } else
      args.push(
        `--manifest=${field(input.manifest, "candidate manifest path")}`,
      );
    if (input.dryRun === true) args.push("--dry-run");
    dev([...args, "--json"]);
  } else if (id.startsWith("template:")) {
    const verb = id.slice(9),
      args = ["template", verb];
    if (["status", "deliver"].includes(verb))
      args.push(field(input.number, "request number"));
    else
      args.push(
        `--source=${target.id}`,
        `--output=${field(input.output, "external export directory")}`,
      );
    if (verb === "publish")
      args.push(`--summary=${field(input.summary, "summary")}`);
    if (input.dryRun === true) args.push("--dry-run");
    // Offline export/check do not use credentials or accept --profile.
    if (["export", "check"].includes(verb))
      commands.push({
        command: process.execPath,
        args: [
          bin,
          ...args,
          "--json",
          "--no-interactive",
          `--workspace-root=${root}`,
        ],
        cwd: root,
      });
    else dev([...args, "--json"]);
  } else if (id === "github:scaffold") {
    const args = [
      "github",
      "scaffold",
      target.projectId ?? "",
      `--output=${field(input.output, "new external workflow directory")}`,
    ];
    if (target.metadata.staticHosting) args.push("--hosting=static");
    commands.push({
      command: process.execPath,
      args: [bin, ...args, "--json", `--workspace-root=${root}`],
      cwd: root,
    });
  } else {
    const operation =
      id === "github:repo"
        ? ["repo", "view"]
        : id === "github:runs"
          ? ["run", "list"]
          : ["workflow", "list"];
    dev([
      "github",
      ...operation,
      `--project=${target.projectId}`,
      `--repository-kind=${choice(field(input.repositoryKind ?? "source", "repository kind"), ["source", "build"])}`,
    ]);
  }
  if (
    ["npm:status", "template:status", "template:deliver"].includes(id) &&
    !/^[1-9]\d*$/.test(String(input.number))
  )
    throw new CiDevUsageError("Enter a positive request number.");
  const destination =
    id === "npm:deliver" ||
    id === "template:deliver" ||
    input.repositoryKind === "build"
      ? target.repository?.buildRepository
      : target.repository?.sourceRepository;
  return {
    target: target.id,
    action: id,
    label: action.label,
    profile,
    destination:
      input.intent === "changed" ||
      ["npm:version", "npm:candidate", "npm:deliver"].includes(id)
        ? "All packages in the release request / candidate manifest"
        : (destination ?? "Local workspace"),
    remote: action.remote === true && input.dryRun !== true,
    commands,
  };
}
