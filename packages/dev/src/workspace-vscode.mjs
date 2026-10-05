import { execa } from "execa";
import {
  lstat,
  readFile,
  readdir,
  mkdtemp,
  writeFile,
  rm,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { crc32 } from "node:zlib";
import { setTimeout as delay } from "node:timers/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CiDevUsageError, CiDevWorkerError } from "./runtime.mjs";
import { ciPublisherPath } from "./publisher-workspace.mjs";
import { ciIsRecord } from "./policy.mjs";

const assets = fileURLToPath(new URL("./vscode-terminal/", import.meta.url));
/** @typedef {{protocol:1,version:string,port:number,token:string,workspaceRoot:string}} TerminalEndpoint */

/** Build a stored ZIP from this extension's exact, reviewed inventory.
 * @param {{name:string,data:Buffer}[]} files
 */
function zip(files) {
  const local = [],
    central = [];
  let offset = 0;
  for (const file of files) {
    const name = Buffer.from(file.name);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50);
    header.writeUInt16LE(20, 4);
    header.writeUInt32LE(crc32(file.data), 14);
    header.writeUInt32LE(file.data.length, 18);
    header.writeUInt32LE(file.data.length, 22);
    header.writeUInt16LE(name.length, 26);
    local.push(header, name, file.data);
    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50);
    entry.writeUInt16LE(20, 4);
    header.copy(entry, 6, 4, 30);
    entry.writeUInt32LE(offset, 42);
    central.push(entry, name);
    offset += header.length + name.length + file.data.length;
  }
  const directory = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, directory, end]);
}

/** @param {string} output */
export async function ciWriteTerminalVSIX(output) {
  const metadata = JSON.parse(
    await readFile(path.join(assets, "package.json"), "utf8"),
  );
  const manifest = `<?xml version="1.0" encoding="utf-8"?>
<PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011">
<Metadata><Identity Language="en-US" Id="workspace-terminals" Version="${metadata.version}" Publisher="cloudigniter"/><DisplayName>CloudIgniter Workspace Terminals</DisplayName><Description xml:space="preserve">Private DEV integrated terminals</Description></Metadata>
<Installation><InstallationTarget Id="Microsoft.VisualStudio.Code"/></Installation><Dependencies/>
<Assets><Asset Type="Microsoft.VisualStudio.Code.Manifest" Path="extension/package.json" Addressable="true"/></Assets>
</PackageManifest>`;
  const contentTypes = `<?xml version="1.0" encoding="utf-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="json" ContentType="application/json"/><Default Extension="cjs" ContentType="application/javascript"/><Default Extension="vsixmanifest" ContentType="text/xml"/></Types>`;
  await writeFile(
    output,
    zip([
      { name: "extension.vsixmanifest", data: Buffer.from(manifest) },
      { name: "[Content_Types].xml", data: Buffer.from(contentTypes) },
      {
        name: "extension/package.json",
        data: await readFile(path.join(assets, "package.json")),
      },
      {
        name: "extension/extension.cjs",
        data: await readFile(path.join(assets, "extension.cjs")),
      },
    ]),
    { flag: "wx" },
  );
  return metadata.version;
}

/** @param {unknown} value @param {string} root @returns {value is TerminalEndpoint} */
function validEndpoint(value, root) {
  return (
    ciIsRecord(value) &&
    value.protocol === 1 &&
    typeof value.version === "string" &&
    Number.isInteger(value.port) &&
    Number(value.port) > 0 &&
    Number(value.port) <= 65535 &&
    typeof value.token === "string" &&
    /^[a-f0-9]{64}$/.test(value.token) &&
    value.workspaceRoot === root
  );
}

/** @param {string} root @param {string} version @param {string|undefined} selectedFile */
async function endpoints(root, version, selectedFile) {
  /** @type {TerminalEndpoint[]} */ const available = [];
  let directory;
  try {
    directory = await ciPublisherPath(root, ".cloudigniter/local");
  } catch (error) {
    if (ciIsRecord(error) && error.code === "ENOENT") return available;
    throw error;
  }
  for (const entry of await readdir(directory)) {
    if (!/^vscode-terminal-\d+\.json$/.test(entry)) continue;
    const filename = await ciPublisherPath(
      root,
      `.cloudigniter/local/${entry}`,
    );
    if (selectedFile && filename !== selectedFile) continue;
    if (!(await lstat(filename)).isFile()) continue;
    try {
      const data = JSON.parse(await readFile(filename, "utf8"));
      if (!validEndpoint(data, root) || data.version !== version) continue;
      const response = await fetch(`http://127.0.0.1:${data.port}/health`, {
        headers: { Authorization: `Bearer ${data.token}` },
        signal: AbortSignal.timeout(500),
        redirect: "error",
      });
      if (
        response.status === 200 &&
        (await response.json()).version === version
      )
        available.push(data);
    } catch {
      /* Stale endpoints are ignored and retained, never deleted by DEV. */
    }
  }
  return available;
}

/** @param {import('./workspace-commands.mjs').WorkspaceTerminalPlan} plan
 * @param {{install?:(vsix:string)=>Promise<void>,env?:NodeJS.ProcessEnv,waitMs?:number}} [services]
 */
export async function ciOpenVSCodeTerminal(plan, services = {}) {
  const env = services.env ?? process.env;
  if (env.TERM_PROGRAM !== "vscode")
    throw new CiDevUsageError(
      "Open this command in VS Code to create a new integrated terminal, or use --external for a system terminal window.",
    );
  if (env.VSCODE_REMOTE_NAME)
    throw new CiDevUsageError(
      "Automatic terminal helper setup currently requires desktop VS Code with a local CloudIgniter Workspace. Use --external on this machine instead.",
    );
  const metadata = JSON.parse(
    await readFile(path.join(assets, "package.json"), "utf8"),
  );
  const selectedFile = env.CLOUDIGNITER_VSCODE_TERMINAL_ENDPOINT;
  let found = await endpoints(
    plan.workspaceRoot,
    metadata.version,
    selectedFile,
  );
  if (!found.length) {
    const temporary = await mkdtemp(
      path.join(tmpdir(), "cloudigniter-terminal-"),
    );
    try {
      const vsix = path.join(temporary, "workspace-terminals.vsix");
      await ciWriteTerminalVSIX(vsix);
      console.log(
        "Preparing the bundled CloudIgniter VS Code terminal helper…",
      );
      await (
        services.install ??
        (async (file) => {
          await execa("code", ["--install-extension", file, "--force"], {
            cwd: plan.workspaceRoot,
            shell: false,
            preferLocal: false,
            timeout: 30_000,
          });
        })
      )(vsix);
    } catch {
      throw new CiDevWorkerError(
        "Could not install the bundled VS Code terminal helper. Make the code CLI available, enable local extension installation, and retry; --external opens a system terminal.",
        1,
      );
    } finally {
      await rm(temporary, { recursive: true, force: true });
    }
    const deadline = Date.now() + (services.waitMs ?? 10_000);
    while (!found.length && Date.now() < deadline) {
      await delay(100);
      found = await endpoints(
        plan.workspaceRoot,
        metadata.version,
        selectedFile,
      );
    }
  }
  if (!found.length)
    throw new CiDevUsageError(
      "The CloudIgniter terminal helper is installed but inactive. Trust this workspace, enable CloudIgniter Workspace Terminals in the active VS Code profile, then run Developer: Reload Window and retry. Your current terminal was not changed.",
    );
  if (found.length > 1)
    throw new CiDevUsageError(
      "This workspace is open in multiple VS Code windows. Close the duplicate workspace window before opening a terminal, or use --external.",
    );
  const endpoint = found[0];
  const name = `CloudIgniter: ${plan.target ?? path.basename(plan.cwd)}`;
  try {
    const response = await fetch(`http://127.0.0.1:${endpoint.port}/terminal`, {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(12_000),
      headers: {
        Authorization: `Bearer ${endpoint.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workspaceRoot: plan.workspaceRoot,
        cwd: plan.cwd,
        name,
        preserveFocus: env.CLOUDIGNITER_TERMINAL_PRESERVE_FOCUS === "1",
      }),
    });
    const result = await response.json();
    if (
      response.status !== 200 ||
      !Number.isInteger(result.pid) ||
      result.name !== name
    )
      throw new Error(
        result.error ?? "The terminal host returned an invalid response.",
      );
    return /** @type {{name:string,pid:number}} */ (result);
  } catch (error) {
    throw new CiDevWorkerError(
      `VS Code could not confirm a new terminal: ${error instanceof Error ? error.message : "request failed"}. Check the VS Code terminal panel before retrying.`,
      1,
    );
  }
}
