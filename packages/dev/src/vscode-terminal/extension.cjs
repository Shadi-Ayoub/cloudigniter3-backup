// The VS Code host supplies `vscode`; no marketplace or runtime dependencies.
const fs = require("node:fs/promises");
const path = require("node:path");
const http = require("node:http");
const { randomBytes } = require("node:crypto");
const { version: extensionVersion } = require("./package.json");

async function realDirectory(directory) {
  const actual = await fs.realpath(directory);
  if (
    path.resolve(directory) !== actual ||
    !(await fs.lstat(actual)).isDirectory()
  )
    throw new Error(
      "Terminal directories must be real directories without symbolic links."
    );
  return actual;
}
const within = (parent, child) => {
  const relative = path.relative(parent, child);
  return (
    relative === "" ||
    (!relative.startsWith(".." + path.sep) &&
      relative !== ".." &&
      !path.isAbsolute(relative))
  );
};
async function isWorkspace(root) {
  try {
    await realDirectory(root);
    const manifest = JSON.parse(
      await fs.readFile(path.join(root, "package.json"), "utf8")
    );
    const dev = JSON.parse(
      await fs.readFile(path.join(root, "packages/dev/package.json"), "utf8")
    );
    await fs.access(path.join(root, "pnpm-workspace.yaml"));
    return (
      manifest.name === "cloudigniter" &&
      manifest.private === true &&
      dev.name === "@cloudigniter/dev"
    );
  } catch {
    return false;
  }
}

async function discoverRoots(folders) {
  const roots = new Set();
  for (const folder of folders) {
    if (folder.uri.scheme !== "file") continue;
    let current = await fs.realpath(folder.uri.fsPath);
    while (true) {
      if (await isWorkspace(current)) {
        roots.add(current);
        break;
      }
      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }
    // Opening the parent of a company checkout is also supported.
    for (const entry of await fs.readdir(folder.uri.fsPath, {
      withFileTypes: true,
    }))
      if (entry.isDirectory()) {
        const child = path.join(folder.uri.fsPath, entry.name);
        if (await isWorkspace(child)) roots.add(child);
      }
  }
  return [...roots];
}

async function closeWorkspaceTerminals(api) {
  if (
    !api.workspace.isTrusted ||
    api.env.remoteName ||
    !(await discoverRoots(api.workspace.workspaceFolders || [])).length
  )
    throw new Error(
      "Terminal cleanup requires a trusted local CloudIgniter Workspace."
    );

  const terminals = [...api.window.terminals];
  if (terminals.length) {
    await new Promise((resolve, reject) => {
      const remaining = new Set(terminals);
      const subscription = api.window.onDidCloseTerminal((terminal) => {
        remaining.delete(terminal);
        if (!remaining.size) finish();
      });
      const timer = setTimeout(
        () =>
          finish(
            new Error(
              "Some terminals did not close; workspace startup was stopped."
            )
          ),
        8000
      );
      function finish(error) {
        clearTimeout(timer);
        subscription.dispose();
        if (error) reject(error);
        else resolve();
      }
      try {
        for (const terminal of terminals) terminal.dispose();
      } catch (error) {
        finish(error);
      }
    });
  }
  // Command variables must resolve to text before VS Code launches the task.
  return `Closed ${terminals.length} local VS Code terminals.`;
}

async function createBridge(api, roots, version = extensionVersion) {
  const token = randomBytes(32).toString("hex");
  const files = [];
  const server = http.createServer(async (request, response) => {
    const send = (status, body) => {
      response.writeHead(status, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      });
      response.end(JSON.stringify(body));
    };
    if (
      request.headers.authorization !== `Bearer ${token}` ||
      request.headers.origin
    ) {
      send(403, { error: "Unauthorized terminal request." });
      return;
    }
    if (request.method === "GET" && request.url === "/health") {
      send(200, { version });
      return;
    }
    if (request.method !== "POST" || request.url !== "/terminal") {
      send(404, { error: "Unknown terminal operation." });
      return;
    }
    try {
      if (!api.workspace.isTrusted)
        throw new Error(
          "Trust the CloudIgniter Workspace before opening terminals."
        );
      let body = "";
      for await (const chunk of request) {
        body += chunk.toString();
        if (Buffer.byteLength(body) > 4096)
          throw new Error("Terminal request is too large.");
      }
      const input = JSON.parse(body);
      if (
        Object.keys(input).some(
          (k) => !["workspaceRoot", "cwd", "name", "preserveFocus"].includes(k)
        ) ||
        typeof input.workspaceRoot !== "string" ||
        typeof input.cwd !== "string" ||
        typeof input.name !== "string" ||
        input.name.length > 120 ||
        /[\x00-\x1f\x7f]/.test(input.name) ||
        typeof input.preserveFocus !== "boolean"
      )
        throw new Error("Invalid terminal request.");
      if (
        !roots.includes(input.workspaceRoot) ||
        !within(input.workspaceRoot, input.cwd) ||
        !(await isWorkspace(input.workspaceRoot))
      )
        throw new Error(
          "Terminal target is outside this VS Code CloudIgniter Workspace."
        );
      const cwd = await realDirectory(input.cwd);
      const terminal = api.window.createTerminal({ name: input.name, cwd });
      let timer;
      try {
        const pid = await Promise.race([
          terminal.processId,
          new Promise((_, reject) => {
            timer = setTimeout(
              () => reject(new Error("The terminal shell did not start.")),
              8000
            );
          }),
        ]);
        if (!Number.isInteger(pid) || pid <= 0)
          throw new Error("The terminal shell could not be started.");
        terminal.show(input.preserveFocus);
        send(200, { name: input.name, pid });
      } catch (error) {
        terminal.dispose();
        throw error;
      } finally {
        clearTimeout(timer);
      }
    } catch (error) {
      send(400, { error: error.message });
    }
  });
  server.requestTimeout = 10_000;
  server.headersTimeout = 10_000;
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const port = server.address().port;
  try {
    for (const root of roots) {
      const policy = path.join(root, ".cloudigniter");
      try {
        await fs.mkdir(policy);
      } catch (error) {
        if (error.code !== "EEXIST") throw error;
      }
      await realDirectory(policy);
      const local = path.join(root, ".cloudigniter/local");
      await fs.mkdir(local, { recursive: true });
      await realDirectory(local);
      const file = path.join(local, `vscode-terminal-${process.pid}.json`);
      await fs.writeFile(
        file,
        JSON.stringify({
          protocol: 1,
          version,
          port,
          token,
          workspaceRoot: root,
        }),
        { flag: "wx", mode: 0o600 }
      );
      files.push(file);
    }
  } catch (error) {
    await close();
    throw error;
  }
  async function close() {
    await new Promise((resolve) => server.close(resolve));
    for (const file of files) {
      try {
        const data = JSON.parse(await fs.readFile(file, "utf8"));
        if (data.token === token) await fs.unlink(file);
      } catch {
        /* Retain unknown or replaced local state. */
      }
    }
  }
  return { close, files };
}

let active;
let refresh = Promise.resolve();
async function activate(context) {
  const api = require("vscode");
  const update = () => {
    refresh = refresh
      .then(async () => {
        if (active) await active.close();
        const roots = await discoverRoots(api.workspace.workspaceFolders || []);
        active =
          api.workspace.isTrusted && roots.length
            ? await createBridge(api, roots)
            : undefined;
        context.environmentVariableCollection.persistent = false;
        context.environmentVariableCollection.clear();
        if (active && active.files.length === 1)
          context.environmentVariableCollection.replace(
            "CLOUDIGNITER_VSCODE_TERMINAL_ENDPOINT",
            active.files[0]
          );
      })
      .catch((error) =>
        api.window.showErrorMessage(`CloudIgniter terminals: ${error.message}`)
      );
    return refresh;
  };
  context.subscriptions.push(
    api.commands.registerCommand(
      "cloudigniter.workspaceTerminals.closeAll",
      () => closeWorkspaceTerminals(api)
    ),
    api.workspace.onDidChangeWorkspaceFolders(update),
    api.workspace.onDidGrantWorkspaceTrust(update)
  );
  await update();
}
async function deactivate() {
  await refresh;
  if (active) await active.close();
}
module.exports = { activate, deactivate, createBridge, discoverRoots };
