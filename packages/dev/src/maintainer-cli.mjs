import { CiDevUsageError } from "./runtime.mjs";
import { ciAssertPackageDirectory } from "./package-config.mjs";
import {
  ciPackageCommands,
  ciPreparePackageBuild,
  ciRunPackageWorkflow,
} from "./package-workflows.mjs";
import {
  ciAssertDeveloperWorkspace,
  ciPromptSelect,
  ciRunWorker,
} from "./maintainer-runtime.mjs";

export const ciMaintainerHelp = `
  Package commands
    package build --mode=dev|prod       Run the package-owned build pipeline.
      --obfuscation=configured|on|off  Retain the recipe default, include or omit obfuscation.
    package switch --target=src|dist    Switch exports and TypeScript mappings.
    package clean-maps                 Remove distribution source maps.
    package clean-dts                  Remove generated declarations outside dist.
    package obfuscate                  Obfuscate distribution JavaScript.

  Shared package workflows (run from packages/<name>)
${Object.values(ciPackageCommands)
  .map(
    (command) => `    package ${command.usage}\n      ${command.description}`,
  )
  .join("\n")}

  Quality commands
    quality scan-client-directives     Check distribution client directives.
    quality list-client-files --root=src  List source files with client/browser signals.

  Next.js package commands
    next build-theme                   Generate the Next package theme stylesheet.
    next test-style --style=standard    Validate a Next package style definition.

  Module commands
    modules validate --kind=core|user [--root=<path>]  Validate module manifests.
    modules sync [--check]             Synchronize module dependencies; --check is read-only.

  Maintainer options
    --no-interactive   Disable build/switch prompts; supply mode/target explicitly.
    --clear            Clear an interactive terminal before rendering.
    --verbose, -v      Include diagnostic error details.

  Maintenance requires the private CloudIgniter workspace, not release policy.
  Package and Next.js workers run from the current package directory.
  From the workspace: pnpm --filter @cloudigniter/next exec dev package test
  Package scripts remain compatibility aliases. Prefer dev commands in daily work.
  Partial build steps do not replace package build or release validation.
`;

/** @type {Record<string, {worker: string, flags?: string[], positional?: boolean}>} */
const commands = {
  "package build": { worker: "internal/ci-build-package.mjs", flags: ["mode", "obfuscation"] },
  "package switch": {
    worker: "internal/ci-switch-sources.mjs",
    flags: ["target"],
  },
  "package clean-maps": { worker: "internal/build-steps/ci-clean-maps.mjs" },
  "package clean-dts": { worker: "internal/build-steps/ci-clean-dts-map.cjs" },
  "package obfuscate": {
    worker: "internal/build-steps/ci-obfuscate-package.mjs",
  },
  "quality scan-client-directives": {
    worker: "internal/ci-scan-missing-use-client.mjs",
  },
  "quality list-client-files": {
    worker: "internal/ci-list-client-files.mjs",
    flags: ["root"],
    positional: true,
  },
  "next build-theme": { worker: "next/build-theme.mjs" },
  "next test-style": {
    worker: "next/ci-test-style.mjs",
    flags: ["style"],
    positional: true,
  },
  "modules validate": {
    worker: "modules/ci-validate-modules.mjs",
    flags: ["kind", "root"],
  },
  "modules sync": {
    worker: "modules/ci-install-module-dependencies.mjs",
    flags: ["check"],
  },
};

/** Reject known flags used with the wrong command, including negated flags.
 * @param {string[]} argv @param {string[]} allowed
 */
export function ciAssertCommandFlags(argv, allowed) {
  const global = [
    "workspace-root",
    "interactive",
    "verbose",
    "help",
    "version",
  ];
  for (const argument of argv) {
    const flag = /^--(?:no-)?([a-z][a-z-]*)(?:=|$)/.exec(argument)?.[1];
    if (flag && !global.includes(flag) && !allowed.includes(flag))
      throw new CiDevUsageError(
        `This command does not accept --${flag}. Run dev --help.`,
      );
  }
}

/** @param {string[]} input
 * @param {import('./types.d.mts').MaintainerFlags} flags
 * @param {string[]} argv
 */
export async function ciRunMaintainerCommand(input, flags, argv) {
  const [group, action, ...extra] = input;
  const key = `${group ?? ""} ${action ?? ""}`.trim();
  const workflow =
    group === "package" && action ? ciPackageCommands[action] : undefined;
  const command = commands[key];
  if ((!command && !workflow) || extra.length > (command?.positional ? 1 : 0))
    throw new CiDevUsageError(
      `Unknown command "${input.join(" ")}". Run dev --help.`,
    );
  ciAssertCommandFlags(argv, [
    "clear",
    ...(workflow?.flags ?? command?.flags ?? []),
  ]);
  if ((flags.root || flags.style) && extra.length)
    throw new CiDevUsageError(
      "Use the named flag or the positional value, not both.",
    );
  const workspaceRoot = await ciAssertDeveloperWorkspace(
    flags.workspaceRoot ?? process.cwd(),
  );
  if (flags.clear && process.stdout.isTTY)
    process.stdout.write("\u001B[2J\u001B[0;0H");
  if (group === "package")
    await ciAssertPackageDirectory(process.cwd(), workspaceRoot);
  if (workflow && action) {
    await ciRunPackageWorkflow(action, {
      cwd: process.cwd(),
      workspaceRoot,
      flags,
    });
    return;
  }
  if (!command) throw new CiDevUsageError("Unknown maintainer command.");
  const args = [];
  if (key === "package build" || key === "package switch") {
    const build = key === "package build";
    const value =
      (build ? flags.mode : flags.target) ??
      (await ciPromptSelect({
        message: build
          ? "Select a build mode"
          : "Select the package export target",
        choices: build ? ["dev", "prod"] : ["src", "dist"],
        interactive: flags.interactive,
      }));
    if (!value)
      throw new CiDevUsageError(
        build
          ? "package build requires --mode=dev|prod."
          : "package switch requires --target=src|dist.",
      );
    args.push(value);
    if (build && flags.obfuscation) args.push(flags.obfuscation);
    if (build) await ciPreparePackageBuild(process.cwd());
  } else if (key === "quality list-client-files") {
    args.push(flags.root ?? extra[0] ?? "src");
  } else if (key === "next test-style") {
    args.push(flags.style ?? extra[0] ?? "standard");
  } else if (key === "modules validate") {
    args.push("--kind", flags.kind ?? "core");
    if (flags.root) args.push("--root", flags.root);
  } else if (key === "modules sync" && flags.check) {
    args.push("--check");
  }
  await ciRunWorker({
    worker: command.worker,
    args,
    workspaceRoot,
    verbose: flags.verbose,
  });
}
