import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  readFile,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";

const command = "cloudigniter.workspaceTerminals.closeAll";
const sourceUrl = new URL(
  "../src/vscode-terminal/extension.cjs",
  import.meta.url
);
const source = await readFile(sourceUrl, "utf8");
const require = createRequire(sourceUrl);

async function fixture(t, options = {}) {
  const root = await realpath(
    await mkdtemp(path.join(tmpdir(), "dev-vscode-startup-"))
  );
  await mkdir(path.join(root, "packages/dev"), { recursive: true });
  await writeFile(
    path.join(root, "package.json"),
    JSON.stringify({ name: "cloudigniter", private: true })
  );
  await writeFile(
    path.join(root, "packages/dev/package.json"),
    JSON.stringify({ name: "@cloudigniter/dev" })
  );
  await writeFile(
    path.join(root, "pnpm-workspace.yaml"),
    "packages:\n  - packages/*\n"
  );
  if (options.outside)
    await writeFile(
      path.join(root, "package.json"),
      JSON.stringify({ name: "other" })
    );

  const commands = new Map();
  const listeners = new Set();
  let notifyDisposals;
  const disposalsRequested = new Promise((resolve) => {
    notifyDisposals = resolve;
  });
  const disposed = [];
  const api = {
    env: { remoteName: options.remote },
    workspace: {
      isTrusted: options.trusted !== false,
      workspaceFolders: [{ uri: { scheme: "file", fsPath: root } }],
      onDidChangeWorkspaceFolders: () => ({ dispose() {} }),
      onDidGrantWorkspaceTrust: () => ({ dispose() {} }),
    },
    commands: {
      registerCommand(id, callback) {
        commands.set(id, callback);
        return {
          dispose() {
            commands.delete(id);
          },
        };
      },
    },
    window: {
      terminals: [],
      showErrorMessage(message) {
        throw new Error(message);
      },
      onDidCloseTerminal(callback) {
        listeners.add(callback);
        return {
          dispose() {
            listeners.delete(callback);
          },
        };
      },
    },
  };
  const close = (terminal) => {
    api.window.terminals = api.window.terminals.filter(
      (current) => current !== terminal
    );
    for (const listener of [...listeners]) listener(terminal);
  };
  const original = (
    options.names ?? ["Old Docs task", "Manual package shell"]
  ).map((name) => ({
    name,
    dispose() {
      disposed.push(this);
      if (disposed.length === original.length) notifyDisposals();
      if (options.autoClose !== false) queueMicrotask(() => close(this));
    },
  }));
  api.window.terminals = [...original];
  const context = {
    subscriptions: [],
    environmentVariableCollection: { clear() {}, replace() {} },
  };
  const module = { exports: {} };
  vm.runInNewContext(
    source,
    {
      module,
      process,
      Buffer,
      console,
      require: (name) => (name === "vscode" ? api : require(name)),
      setTimeout: options.fastTimers
        ? (fn, ms) => setTimeout(fn, Math.min(ms, 20))
        : setTimeout,
      clearTimeout,
    },
    { filename: sourceUrl.pathname }
  );
  t.after(async () => {
    await module.exports.deactivate();
    for (const subscription of context.subscriptions) subscription.dispose();
    await rm(root, { recursive: true, force: true });
  });
  await module.exports.activate(context);
  assert.ok(
    commands.has(command),
    "The terminal helper must register the startup cleanup command."
  );
  return {
    api,
    run: commands.get(command),
    disposed,
    listeners,
    original,
    close,
    disposalsRequested,
  };
}

test("startup cleanup waits for every existing terminal to close before returning task text", async (t) => {
  const f = await fixture(t, { autoClose: false });
  let finished = false;
  const completion = f.run().then((result) => {
    finished = true;
    return result;
  });
  await f.disposalsRequested;
  assert.deepEqual(f.disposed, f.original);
  assert.equal(finished, false);
  f.close(f.original[0]);
  await Promise.resolve();
  assert.equal(finished, false);
  f.close(f.original[1]);
  assert.match(await completion, /Closed 2 local VS Code terminals/);
  assert.equal(f.api.window.terminals.length, 0);
  assert.equal(f.listeners.size, 0);
});

test("startup cleanup succeeds without creating a terminal when none are open", async (t) => {
  const f = await fixture(t, { names: [] });
  assert.match(await f.run(), /Closed 0 local VS Code terminals/);
  assert.equal(f.disposed.length, 0);
  assert.equal(f.listeners.size, 0);
});

test("startup cleanup refuses untrusted, remote and unrelated workspaces without disposal", async (t) => {
  for (const options of [
    { trusted: false },
    { remote: "ssh-remote" },
    { outside: true },
  ]) {
    const f = await fixture(t, options);
    await assert.rejects(f.run(), /trusted local CloudIgniter Workspace/i);
    assert.equal(f.disposed.length, 0);
    assert.equal(f.listeners.size, 0);
  }
});

test("incomplete terminal closure fails startup and releases its listener", async (t) => {
  const f = await fixture(t, { autoClose: false, fastTimers: true });
  await assert.rejects(f.run(), /did not close.*startup was stopped/i);
  assert.equal(f.listeners.size, 0);
  assert.equal(f.api.window.terminals.length, 2);
});
