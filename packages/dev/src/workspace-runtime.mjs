import { execa } from "execa";
import { createServer, connect } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import path from "node:path";
import { CiDevUsageError, CiDevWorkerError } from "./runtime.mjs";
import { ciOpenVSCodeTerminal } from "./workspace-vscode.mjs";

/** @param {string} url */
export async function ciOpenWorkspaceBrowser(url) {
  const command =
    process.platform === "darwin"
      ? "open"
      : process.platform === "win32"
        ? "rundll32"
        : "xdg-open";
  const args =
    process.platform === "win32" ? ["url.dll,FileProtocolHandler", url] : [url];
  try {
    await execa(command, args, {
      shell: false,
      preferLocal: false,
      timeout: 10_000,
    });
  } catch {
    console.error(`Browser could not be opened. Open ${url} manually.`);
  }
}

/** @param {string} host @param {number} port */
async function assertAvailable(host, port) {
  const probe = createServer();
  await new Promise((resolve, reject) => {
    probe.once("error", reject);
    probe.listen({ host, port, exclusive: true }, () => resolve(undefined));
  }).catch(() => {
    throw new CiDevUsageError(
      `Cannot bind ${host}:${port}. The port may already be in use; choose --port=<another-port>.`,
    );
  });
  await new Promise((resolve, reject) =>
    probe.close((error) => (error ? reject(error) : resolve(undefined))),
  );
}

/** @param {string} url */
async function acceptingConnections(url) {
  const address = new URL(url);
  return new Promise((resolve) => {
    const socket = connect({
      host: address.hostname.replace(/^\[|\]$/g, ""),
      port: Number(address.port),
    });
    const done = (ready = false) => {
      socket.destroy();
      resolve(ready);
    };
    socket.setTimeout(500);
    socket.once("connect", () => done(true));
    socket.once("error", () => done());
    socket.once("timeout", () => done());
  });
}

/** @param {import('./workspace-commands.mjs').WorkspaceStartPlan} plan
 * @param {{open?:(url:string)=>Promise<void>,ready?:(url:string)=>Promise<unknown>,log?:(text:string)=>void}} [services]
 */
export async function ciRunWorkspaceServer(plan, services = {}) {
  await assertAvailable(plan.host, plan.port);
  const log = services.log ?? console.log;
  log(
    `CloudIgniter Workspace — ${plan.target} (${plan.mode})\n${plan.url}\nDirectory: ${plan.cwd}\nPress Ctrl+C to stop.`,
  );
  // Reuse the pnpm that launched DEV instead of an unrelated PATH version.
  const pnpm = process.env.npm_execpath;
  const useNode =
    plan.command === "pnpm" &&
    pnpm &&
    /^pnpm\.(?:cjs|js)$/.test(path.basename(pnpm));
  const child = execa(
    useNode ? process.execPath : plan.command,
    useNode ? [pnpm, ...plan.args] : plan.args,
    {
      cwd: plan.cwd,
      shell: false,
      preferLocal: true,
      detached: process.platform !== "win32",
      stdio: "inherit",
      reject: false,
      env: { BROWSER: "none" },
    },
  );
  let finished = false;
  let cancelled = false;
  /** @type {NodeJS.Timeout|undefined} */ let killTimer;
  /** @param {NodeJS.Signals} signal */
  const kill = (signal) => {
    if (!child.pid || finished) return;
    try {
      if (process.platform !== "win32") process.kill(-child.pid, signal);
      else
        void execa("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
          reject: false,
          shell: false,
        }).catch(() => child.kill(signal));
    } catch {
      /* The owned process has already exited. */
    }
  };
  const stop = () => {
    cancelled = true;
    kill("SIGTERM");
    killTimer ??= setTimeout(() => kill("SIGKILL"), 3000);
    killTimer.unref();
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  const completion = child.then((result) => {
    finished = true;
    return result;
  });
  const browser = (async () => {
    while (!finished && !cancelled) {
      if (await (services.ready ?? acceptingConnections)(plan.url)) {
        if (!finished && !cancelled && plan.open)
          await (services.open ?? ciOpenWorkspaceBrowser)(plan.url);
        return;
      }
      await delay(150);
    }
  })();
  try {
    const result = await completion;
    await browser;
    const code = cancelled ? 130 : (result.exitCode ?? 1);
    if (code !== 0)
      throw new CiDevWorkerError(
        cancelled
          ? "Workspace server stopped."
          : `The ${plan.target} server exited with status ${code}.`,
        code,
      );
  } finally {
    finished = true;
    clearTimeout(killTimer);
    process.off("SIGINT", stop);
    process.off("SIGTERM", stop);
  }
}

/** Platform adapter takes paths as arguments, never as unquoted shell input.
 * @param {string} cwd @param {NodeJS.Platform} [platform] @param {string} [shell]
 */
export function ciWorkspaceTerminalInvocation(
  cwd,
  platform = process.platform,
  shell = process.env.SHELL,
) {
  if (platform === "darwin")
    return {
      command: "osascript",
      args: [
        "-e",
        `on run argv
  tell application "Terminal"
    activate
    do script ("cd -- " & quoted form of (item 1 of argv) & " && exec " & quoted form of (item 2 of argv) & " -l")
  end tell
end run`,
        cwd,
        shell && path.isAbsolute(shell) ? shell : "/bin/zsh",
      ],
    };
  if (platform === "win32")
    return {
      command: "wt.exe",
      args: ["--window", "new", "new-tab", "--startingDirectory", cwd],
    };
  return {
    command: "x-terminal-emulator",
    args: ["-e", shell && path.isAbsolute(shell) ? shell : "/bin/bash", "-l"],
  };
}

/** @param {import('./workspace-commands.mjs').WorkspaceTerminalPlan} plan
 * @param {{integrated?:typeof ciOpenVSCodeTerminal}} [services]
 */
export async function ciOpenWorkspaceTerminal(plan, services = {}) {
  console.log(`CloudIgniter Workspace terminal\nDirectory: ${plan.cwd}`);
  if (plan.terminal === "integrated") {
    const result = await (services.integrated ?? ciOpenVSCodeTerminal)(plan);
    console.log(`Opened new VS Code terminal: ${result.name}`);
    return;
  }
  const invocation = ciWorkspaceTerminalInvocation(plan.cwd);
  try {
    if (process.platform !== "darwin" && process.platform !== "win32") {
      const child = execa(invocation.command, invocation.args, {
        cwd: plan.cwd,
        shell: false,
        preferLocal: false,
        detached: true,
        stdio: "ignore",
        reject: false,
      });
      void child.catch(() => undefined);
      await new Promise((resolve, reject) => {
        child.once("spawn", () => resolve(undefined));
        child.once("error", reject);
      });
      child.unref();
      return;
    }
    const result = await execa(invocation.command, invocation.args, {
      cwd: plan.cwd,
      shell: false,
      preferLocal: false,
      timeout: 15_000,
      reject: false,
    });
    if (result.exitCode !== 0)
      throw new CiDevWorkerError(
        `Terminal could not be opened (${invocation.command}). Check the system terminal installation/permissions or run inside VS Code without --external.`,
        result.exitCode ?? 1,
      );
  } catch (error) {
    if (error instanceof CiDevWorkerError) throw error;
    throw new CiDevWorkerError(
      `Terminal could not be opened (${invocation.command}). Check the system terminal installation/permissions or run inside VS Code without --external.`,
      1,
    );
  }
}
