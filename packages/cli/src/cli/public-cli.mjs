import path from "node:path";

import meow from "meow";

import { ciPublicHelp } from "./help.mjs";
import {
  CiCliUsageError,
  ciClearTerminal,
  ciFindWorkspaceRoot,
  ciHandleCliError,
  ciInstallUnhandledErrorGuards,
  ciPrintWelcome,
  ciPromptInput,
  ciPromptSelect,
  ciRunLocalCommand,
  ciRunWorker,
  ciWorkerRoot,
} from "./runtime.mjs";

function ciCreatePublicParser() {
  return meow(ciPublicHelp, {
    importMeta: import.meta,
    allowUnknownFlags: false,
    flags: {
      appRoot: { type: "string" },
      workspaceRoot: { type: "string" },
      profile: { type: "string" },
      identifier: { type: "string" },
      port: { type: "number" },
      open: { type: "boolean", default: true },
      root: { type: "string" },
      interactive: { type: "boolean", default: true },
      verbose: { type: "boolean", shortFlag: "v" },
      clear: { type: "boolean" },
    },
  });
}

async function ciResolvePublicCommand(input, interactive) {
  if (input.length > 0) return input;

  ciPrintWelcome();
  const command = await ciPromptSelect({
    message: "What would you like to do?",
    disabled: !interactive,
    choices: [
      { name: "modules validate", message: "Validate application modules" },
      {
        name: "resources studio",
        message: "Open the local Resource Studio",
      },
      {
        name: "amplify bootstrap access-control",
        message: "Bootstrap access control",
      },
      {
        name: "amplify bootstrap root-user",
        message: "Bootstrap the root user",
      },
      {
        name: "amplify sandbox bootstrap",
        message: "Bootstrap an Amplify sandbox",
      },
      {
        name: "amplify sandbox deploy",
        message: "Deploy generated resources to an Amplify sandbox",
      },
    ],
  });

  return command ? command.split(" ") : [];
}

async function ciRunBootstrapWorker({
  worker,
  appRoot,
  workspaceRoot,
  profile,
  verbose,
}) {
  const args = ["--app-root", appRoot];
  if (profile) args.push("--profile", profile);

  await ciRunWorker({
    worker,
    args,
    cwd: appRoot,
    workspaceRoot,
    spinnerText: worker.includes("access-control")
      ? "Bootstrapping access control"
      : "Bootstrapping the root user",
    verbose,
  });
}

async function ciResolveRequiredDeployOption({
  value,
  message,
  missingMessage,
  interactive,
}) {
  const resolved =
    value ??
    (await ciPromptInput({
      message,
      disabled: !interactive,
    }));
  if (!resolved) throw new CiCliUsageError(missingMessage);
  return resolved;
}

export async function ciRunPublicCli() {
  ciInstallUnhandledErrorGuards();
  const cli = ciCreatePublicParser();
  ciClearTerminal(cli.flags.clear);

  try {
    const appRoot = path.resolve(cli.flags.appRoot ?? process.cwd());
    const workspaceRoot = path.resolve(
      cli.flags.workspaceRoot ?? (await ciFindWorkspaceRoot(appRoot)),
    );
    const command = await ciResolvePublicCommand(
      cli.input,
      cli.flags.interactive,
    );

    if (command.length === 0) {
      console.log(ciPublicHelp.trim());
      return;
    }

    const commandKey = command.join(" ");

    if (commandKey === "resources studio") {
      const args = ["--app-root", appRoot];
      if (cli.flags.profile) args.push("--profile", cli.flags.profile);
      if (cli.flags.identifier) args.push("--identifier", cli.flags.identifier);
      if (cli.flags.port !== undefined)
        args.push("--port", String(cli.flags.port));
      if (!cli.flags.open) args.push("--no-open");
      await ciRunWorker({
        worker: "resources/studio.mjs",
        args,
        cwd: appRoot,
        workspaceRoot,
        verbose: cli.flags.verbose,
      });
      return;
    }

    if (commandKey === "modules validate") {
      const args = ["--kind", "user"];
      if (cli.flags.root) args.push("--root", cli.flags.root);
      await ciRunWorker({
        worker: "modules/ci-validate-modules.mjs",
        args,
        cwd: appRoot,
        workspaceRoot,
        spinnerText: "Validating application modules",
        verbose: cli.flags.verbose,
      });
      return;
    }

    if (commandKey === "amplify sandbox deploy") {
      const profile = await ciResolveRequiredDeployOption({
        value: cli.flags.profile,
        message: "AWS profile",
        missingMessage:
          'Amplify sandbox deployment requires an explicit AWS profile. Pass "--profile=<name>".',
        interactive: cli.flags.interactive,
      });
      const identifier = await ciResolveRequiredDeployOption({
        value: cli.flags.identifier,
        message:
          "Amplify sandbox identifier (1-15 letters, numbers, or hyphens)",
        missingMessage:
          'Amplify sandbox deployment requires an explicit identifier. Pass "--identifier=<value>".',
        interactive: cli.flags.interactive,
      });
      await ciRunWorker({
        worker: "amplify/sandbox-deploy.mjs",
        args: [
          "--app-root",
          appRoot,
          "--profile",
          profile,
          "--identifier",
          identifier,
        ],
        cwd: appRoot,
        workspaceRoot,
        verbose: cli.flags.verbose,
      });
      return;
    }

    if (
      commandKey === "amplify bootstrap access-control" ||
      commandKey === "amplify bootstrap root-user"
    ) {
      const profile =
        cli.flags.profile ??
        (await ciPromptInput({
          message: "AWS profile (leave empty for the default credential chain)",
          disabled: !cli.flags.interactive,
        }));
      await ciRunBootstrapWorker({
        worker:
          commandKey === "amplify bootstrap access-control"
            ? "amplify/bootstrap-access-control.ts"
            : "amplify/bootstrap-root-user.ts",
        appRoot,
        workspaceRoot,
        profile,
        verbose: cli.flags.verbose,
      });
      return;
    }

    if (commandKey === "amplify sandbox bootstrap") {
      const profile =
        cli.flags.profile ??
        (await ciPromptInput({
          message: "AWS profile (leave empty for the default credential chain)",
          disabled: !cli.flags.interactive,
        }));
      const warningFilter = path.join(
        ciWorkerRoot,
        "amplify/suppress-root-auth-warning.cjs",
      );
      const sandboxArgs = ["sandbox", "--once"];
      if (profile) sandboxArgs.push("--profile", profile);
      if (cli.flags.identifier) {
        sandboxArgs.push("--identifier", cli.flags.identifier);
      }

      await ciRunLocalCommand({
        command: "ampx",
        args: sandboxArgs,
        cwd: appRoot,
        env: {
          NODE_OPTIONS: [
            process.env.NODE_OPTIONS,
            `--require=${JSON.stringify(warningFilter)}`,
          ]
            .filter(Boolean)
            .join(" "),
        },
      });
      await ciRunBootstrapWorker({
        worker: "amplify/bootstrap-access-control.ts",
        appRoot,
        workspaceRoot,
        profile,
        verbose: cli.flags.verbose,
      });
      await ciRunBootstrapWorker({
        worker: "amplify/bootstrap-root-user.ts",
        appRoot,
        workspaceRoot,
        profile,
        verbose: cli.flags.verbose,
      });
      return;
    }

    throw new CiCliUsageError(
      `Unknown command "${commandKey}". Run ci --help to see supported commands.`,
    );
  } catch (error) {
    await ciHandleCliError(error, { verbose: cli.flags.verbose });
  }
}
