import path from "node:path";

import meow from "meow";

import { ciDeveloperHelp } from "./help.mjs";
import {
  CiCliUsageError,
  ciAssertDeveloperWorkspace,
  ciClearTerminal,
  ciFindWorkspaceRoot,
  ciHandleCliError,
  ciInstallUnhandledErrorGuards,
  ciPrintWelcome,
  ciPromptSelect,
  ciRunWorker,
} from "./runtime.mjs";

function ciCreateDeveloperParser() {
  return meow(ciDeveloperHelp, {
    importMeta: import.meta,
    allowUnknownFlags: false,
    flags: {
      workspaceRoot: { type: "string" },
      mode: { type: "string", choices: ["dev", "prod"] },
      target: { type: "string", choices: ["src", "dist"] },
      kind: { type: "string", choices: ["core", "user"] },
      root: { type: "string" },
      style: { type: "string" },
      check: { type: "boolean" },
      verbose: { type: "boolean", shortFlag: "v" },
      clear: { type: "boolean" },
    },
  });
}

export async function ciRunDeveloperCli() {
  ciInstallUnhandledErrorGuards();
  const cli = ciCreateDeveloperParser();
  ciClearTerminal(cli.flags.clear);

  try {
    if (cli.input.length === 0) {
      ciPrintWelcome({ developer: true });
      console.log(ciDeveloperHelp.trim());
      return;
    }

    const workspaceRoot = path.resolve(
      cli.flags.workspaceRoot ?? (await ciFindWorkspaceRoot()),
    );
    await ciAssertDeveloperWorkspace(workspaceRoot);
    const [group, command, ...extraInput] = cli.input;
    const commandKey = `${group ?? ""} ${command ?? ""}`.trim();
    const common = {
      cwd: process.cwd(),
      workspaceRoot,
      verbose: cli.flags.verbose,
    };

    if (commandKey === "package build") {
      const mode =
        cli.flags.mode ??
        (await ciPromptSelect({
          message: "Select a build mode",
          choices: [
            { name: "dev", message: "Development" },
            { name: "prod", message: "Production" },
          ],
        }));
      if (!mode) throw new CiCliUsageError("package build requires --mode=dev|prod.");
      await ciRunWorker({
        ...common,
        worker: "internal/ci-build-package.mjs",
        args: [mode],
      });
      return;
    }

    if (commandKey === "package switch") {
      const target =
        cli.flags.target ??
        (await ciPromptSelect({
          message: "Select the package export target",
          choices: ["src", "dist"],
        }));
      if (!target) throw new CiCliUsageError("package switch requires --target=src|dist.");
      await ciRunWorker({
        ...common,
        worker: "internal/ci-switch-sources.mjs",
        args: [target],
      });
      return;
    }

    const packageWorkers = {
      "package clean-maps": "internal/build-steps/ci-clean-maps.mjs",
      "package clean-dts": "internal/build-steps/ci-clean-dts-map.cjs",
      "package obfuscate": "internal/build-steps/ci-obfuscate-package.mjs",
      "package build-assets": "internal/build-steps/ci-build-next-app-assets.mjs",
    };
    if (packageWorkers[commandKey]) {
      await ciRunWorker({ ...common, worker: packageWorkers[commandKey] });
      return;
    }

    if (commandKey === "quality scan-client-directives") {
      await ciRunWorker({
        ...common,
        worker: "internal/ci-scan-missing-use-client.mjs",
      });
      return;
    }

    if (commandKey === "quality list-client-files") {
      await ciRunWorker({
        ...common,
        worker: "internal/ci-list-client-files.mjs",
        args: [cli.flags.root ?? extraInput[0] ?? "src"],
      });
      return;
    }

    if (commandKey === "next build-theme") {
      await ciRunWorker({ ...common, worker: "next/build-theme.mjs" });
      return;
    }

    if (commandKey === "next test-style") {
      await ciRunWorker({
        ...common,
        worker: "next/ci-test-style.mjs",
        args: [cli.flags.style ?? extraInput[0] ?? "standard"],
      });
      return;
    }

    if (commandKey === "modules validate") {
      const kind = cli.flags.kind ?? "core";
      const args = ["--kind", kind];
      if (cli.flags.root) args.push("--root", cli.flags.root);
      await ciRunWorker({
        ...common,
        worker: "modules/ci-validate-modules.mjs",
        args,
      });
      return;
    }

    if (commandKey === "modules sync") {
      await ciRunWorker({
        ...common,
        worker: "modules/ci-install-module-dependencies.mjs",
        args: cli.flags.check ? ["--check"] : [],
      });
      return;
    }

    throw new CiCliUsageError(
      `Unknown command "${commandKey}". Run ci-dev --help to see supported commands.`,
    );
  } catch (error) {
    await ciHandleCliError(error, { verbose: cli.flags.verbose });
  }
}
