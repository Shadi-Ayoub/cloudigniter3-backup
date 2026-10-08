import { execa } from "execa";
import { realpath } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { CiDevUsageError, CiDevWorkerError } from "./runtime.mjs";
import { ciIsRecord } from "./policy.mjs";

/** @typedef {{pid:number,parent:number,started:string,command:string}} ServerProcess */
/** @typedef {{processes:Map<number,ServerProcess>,listeners:number[]}} ServerSnapshot */

/** @param {string} command @param {string[]} args */
async function inspect(command, args) {
  return execa(command, args, {
    shell: false, preferLocal: false, reject: false, timeout: 5000,
    maxBuffer: 4 * 1024 * 1024, env: { LC_ALL: "C" },
  });
}

/** @param {number} port @returns {Promise<ServerSnapshot>} */
async function snapshot(port) {
  /** @type {Map<number,ServerProcess>} */
  const processes = new Map();
  if (process.platform === "win32") {
    if (!Number.isSafeInteger(port) || port < 1 || port > 65535)
      throw new Error("Invalid inspection port.");
    const script = `
      $ErrorActionPreference = 'Stop'
      $port = ${port}
      $processes = @(Get-CimInstance Win32_Process | ForEach-Object {
        $started = if ($null -ne $_.CreationDate) { [string]$_.CreationDate.ToUniversalTime().Ticks } else { '' }
        @{ pid = [int]$_.ProcessId; parent = [int]$_.ParentProcessId;
           started = $started;
           command = [string]$_.CommandLine }
      })
      $listeners = @(Get-NetTCPConnection -State Listen -ErrorAction Stop |
        Where-Object { $_.LocalPort -eq $port } |
        Select-Object -ExpandProperty OwningProcess -Unique)
      @{ processes = $processes; listeners = $listeners } | ConvertTo-Json -Depth 4 -Compress
    `;
    const result = await inspect("powershell.exe", ["-NoProfile", "-NonInteractive", "-EncodedCommand",
      Buffer.from(script, "utf16le").toString("base64")]);
    if (result.exitCode !== 0)
      throw new Error("PowerShell could not inspect the listening processes.");
    /** @type {unknown} */
    const parsed = JSON.parse(result.stdout);
    if (!ciIsRecord(parsed) || !Array.isArray(parsed.processes) || !Array.isArray(parsed.listeners))
      throw new Error("Invalid process inspection result.");
    for (const row of parsed.processes) {
      if (!ciIsRecord(row) || typeof row.pid !== "number" || typeof row.parent !== "number" ||
        !Number.isSafeInteger(row.pid) || !Number.isSafeInteger(row.parent) ||
        typeof row.started !== "string" || typeof row.command !== "string")
        throw new Error("Invalid process identity.");
      processes.set(row.pid, { pid: row.pid, parent: row.parent, started: row.started, command: row.command });
    }
    const listeners = parsed.listeners;
    if (!listeners.every(pid => typeof pid === "number" && Number.isSafeInteger(pid) && pid > 0))
      throw new Error("Invalid listener identity.");
    return { processes, listeners };
  }
  const [table, ports] = await Promise.all([
    inspect("ps", ["-axo", "pid=,ppid=,stat=,lstart=,args="]),
    inspect("lsof", ["-nP", "-t", `-iTCP:${port}`, "-sTCP:LISTEN"]),
  ]);
  if (table.exitCode !== 0 || (ports.exitCode !== 0 && ports.exitCode !== 1))
    throw new Error("ps/lsof could not inspect the listening processes.");
  for (const line of table.stdout.split("\n")) {
    const row = line.match(/^\s*(\d+)\s+(\d+)\s+(\S+)\s+(\w{3}\s+\w{3}\s+\d+\s+\d{2}:\d{2}:\d{2}\s+\d{4})\s+(.*)$/);
    if (!row || row[3].startsWith("Z")) continue;
    const pid = Number(row[1]);
    processes.set(pid, { pid, parent: Number(row[2]), started: row[4], command: row[5] });
  }
  const listeners = [...new Set(ports.stdout.trim().split(/\s+/).filter(Boolean).map(Number))];
  if (!listeners.every(pid => Number.isSafeInteger(pid) && pid > 0))
    throw new Error("Invalid listener identity.");
  return { processes, listeners };
}

/** @param {ServerProcess} info @param {string} directory */
async function inProject(info, directory) {
  const prefix = path.join(directory, "node_modules") + path.sep;
  // pnpm's shims retain the project-local path even if cwd inspection is unavailable.
  if (process.platform === "win32")
    return info.command.toLowerCase().includes(prefix.toLowerCase());
  if (info.command.includes(prefix)) return true;
  try {
    if (process.platform === "linux")
      return await realpath(`/proc/${info.pid}/cwd`) === directory;
    const result = await inspect("lsof", ["-a", "-p", String(info.pid), "-d", "cwd", "-Fn"]);
    return result.exitCode === 0 && result.stdout.split("\n").includes(`n${directory}`);
  } catch {
    return false;
  }
}

/** @param {ServerProcess} info @param {'next'|'docusaurus'|'static'} framework */
function frameworkServer(info, framework) {
  return framework === "next"
    ? /(?:^|[\\/\s])next(?:\.mjs|\.js|\.cmd)?["']?\s+(?:dev|start)(?:\s|$)/.test(info.command)
    : framework === "docusaurus" &&
      /(?:^|[\\/\s])docusaurus(?:\.mjs|\.js|\.cmd)?["']?\s+(?:start|serve)(?:\s|$)/.test(info.command);
}

/** @param {number} pid @param {ServerSnapshot} state @param {import('./workspace-commands.mjs').WorkspaceStartPlan} plan */
async function serverRoot(pid, state, plan) {
  const visited = new Set();
  while (pid > 1 && !visited.has(pid) && visited.size < 40) {
    visited.add(pid);
    const info = state.processes.get(pid);
    if (!info || info.pid === process.pid) break;
    if (info.started && frameworkServer(info, plan.framework) && await inProject(info, plan.cwd)) return info;
    pid = info.parent;
  }
}

/** @param {ServerProcess} expected @param {ServerProcess|undefined} actual */
function sameProcess(expected, actual) {
  return !!actual && expected.pid === actual.pid && expected.started === actual.started && expected.command === actual.command;
}

/** @param {ServerProcess[]} roots @param {ServerSnapshot} state */
function processTree(roots, state) {
  const owned = new Map(roots.map(info => [info.pid, info]));
  for (let changed = true; changed;) {
    changed = false;
    for (const info of state.processes.values()) {
      if (!owned.has(info.pid) && owned.has(info.parent)) {
        owned.set(info.pid, info);
        changed = true;
      }
    }
  }
  return [...owned.values()];
}

/** @param {ServerProcess[]} owned @param {number} port @param {NodeJS.Signals} signal */
async function signalTree(owned, port, signal) {
  const current = await snapshot(port);
  for (const info of owned) {
    if (!sameProcess(info, current.processes.get(info.pid))) continue;
    try { process.kill(info.pid, signal); }
    catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "ESRCH")) throw error;
    }
  }
}

/** @param {ServerProcess[]} owned @param {number} port @param {number} timeout */
async function waitForExit(owned, port, timeout) {
  const deadline = Date.now() + timeout;
  do {
    const current = await snapshot(port);
    if (owned.every(info => !sameProcess(info, current.processes.get(info.pid)))) return true;
    await delay(150);
  } while (Date.now() < deadline);
  return false;
}

/** Stop only verified framework processes for this project.
 * @param {import('./workspace-commands.mjs').WorkspaceStartPlan} plan
 * @param {(text:string)=>void} log
 * @param {boolean} [portWasAvailable] Permit a free-port launch if inspection tools are unavailable.
 */
export async function ciRestartWorkspaceServer(plan, log, portWasAvailable = false) {
  try {
    let initial;
    try { initial = await snapshot(plan.port); }
    catch (error) {
      // Inspection failure never authorizes signals. A confirmed free bind can
      // still start normally on systems without these optional process tools.
      if (portWasAvailable) return;
      throw error;
    }
    if (!initial.listeners.length) return;
    const found = await Promise.all(initial.listeners.map(pid => serverRoot(pid, initial, plan)));
    if (found.some(info => !info))
      throw new CiDevUsageError(`Cannot bind ${plan.host}:${plan.port}. The port may already be in use by an unrelated or unverified server; stop its known owner or choose --port=<another-port>.`);
    const roots = [...new Map(found.filter(info => info !== undefined).map(info => [info.pid, info])).values()];
    // Recheck listener ownership and process birth times before sending signals.
    const current = await snapshot(plan.port);
    if (!current.listeners.length) return;
    if (current.listeners.some(pid => !initial.listeners.includes(pid)) ||
      roots.some(info => !sameProcess(info, current.processes.get(info.pid))))
      throw new CiDevUsageError(`Server ownership changed on port ${plan.port}; retry the command.`);
    const owned = processTree(roots, current);
    log(`Restarting ${plan.target}: stopping its existing Workspace server on port ${plan.port}…`);
    await signalTree(owned, plan.port, "SIGTERM");
    if (!await waitForExit(owned, plan.port, 3000)) {
      log(`Waiting for ${plan.target} shutdown; terminating its remaining server processes…`);
      await signalTree(owned, plan.port, "SIGKILL");
      if (!await waitForExit(owned, plan.port, 3000))
        throw new CiDevWorkerError(`The previous ${plan.target} server did not stop. Retry after its processes exit.`, 1);
    }
  } catch (error) {
    if (error instanceof CiDevUsageError || error instanceof CiDevWorkerError) throw error;
    throw new CiDevUsageError(`Cannot safely restart ${plan.target} on port ${plan.port}: ${error instanceof Error ? error.message : String(error)}. Ensure ${process.platform === "win32" ? "PowerShell process inspection" : "ps and lsof"} is available, or stop its known owner before retrying.`);
  }
}
