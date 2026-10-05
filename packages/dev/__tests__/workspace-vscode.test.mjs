import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  realpath,
  rm,
  symlink,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import test from "node:test";
import {
  ciOpenVSCodeTerminal,
  ciWriteTerminalVSIX,
} from "../src/workspace-vscode.mjs";
import { ciOpenWorkspaceTerminal } from "../src/workspace-runtime.mjs";
const { createBridge, discoverRoots } = createRequire(import.meta.url)(
  "../src/vscode-terminal/extension.cjs",
);

async function fixture(t, shell = Promise.resolve(4321)) {
  const root = await realpath(
    await mkdtemp(path.join(tmpdir(), "dev-vscode-terminal-")),
  );
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, "packages/dev"), { recursive: true });
  await mkdir(path.join(root, "docs"));
  await mkdir(path.join(root, "apps/jodaris"), { recursive: true });
  await writeFile(
    path.join(root, "package.json"),
    JSON.stringify({ name: "cloudigniter", private: true }),
  );
  await writeFile(
    path.join(root, "packages/dev/package.json"),
    JSON.stringify({ name: "@cloudigniter/dev" }),
  );
  await writeFile(
    path.join(root, "pnpm-workspace.yaml"),
    "packages:\n  - packages/*\n",
  );
  const created = [];
  const api = {
    workspace: { isTrusted: true },
    window: {
      createTerminal(options) {
        const terminal = {
          ...options,
          processId: shell,
          shown: undefined,
          disposed: false,
          show(preserveFocus) {
            this.shown = preserveFocus;
          },
          dispose() {
            this.disposed = true;
          },
        };
        created.push(terminal);
        return terminal;
      },
    },
  };
  const bridge = await createBridge(api, [root]);
  t.after(() => bridge.close());
  const endpoint = JSON.parse(await readFile(bridge.files[0], "utf8"));
  const plan = {
    kind: "terminal",
    terminal: "integrated",
    workspaceRoot: root,
    target: "docs",
    cwd: path.join(root, "docs"),
  };
  return { root, created, api, endpoint, plan };
}

test("each DEV invocation creates a separate terminal and returns after its shell starts", async (t) => {
  const { root, created, plan } = await fixture(t);
  const env = { TERM_PROGRAM: "vscode" };
  await ciOpenWorkspaceTerminal(plan, {
    integrated: (p) => ciOpenVSCodeTerminal(p, { env }),
  });
  await ciOpenVSCodeTerminal(plan, { env });
  await ciOpenVSCodeTerminal(
    { ...plan, cwd: path.join(root, "apps/jodaris"), target: "jodaris" },
    { env: { ...env, CLOUDIGNITER_TERMINAL_PRESERVE_FOCUS: "1" } },
  );
  assert.equal(created.length, 3);
  assert.equal(created[0].cwd, plan.cwd);
  assert.equal(created[0].shown, false);
  assert.equal(created[2].shown, true);
  assert.notEqual(created[0], created[1]);
  assert.ok(created.every((terminal) => !terminal.disposed));
});

test("new terminal default requires VS Code rather than occupying the invoking shell", async (t) => {
  const { plan, created } = await fixture(t);
  await assert.rejects(
    ciOpenVSCodeTerminal(plan, { env: { TERM_PROGRAM: "Apple_Terminal" } }),
    /VS Code.*--external/,
  );
  assert.equal(created.length, 0);
});

test("new VS Code terminals retain literal special-character paths and invoking-window selection", async (t) => {
  const { root, plan, endpoint, created } = await fixture(t);
  const cwd = path.join(root, "Docs 'quoted' $HOME; folder");
  await mkdir(cwd);
  const original = path.join(
    root,
    ".cloudigniter/local",
    `vscode-terminal-${process.pid}.json`,
  );
  await writeFile(
    path.join(root, ".cloudigniter/local/vscode-terminal-999999.json"),
    JSON.stringify(endpoint),
  );
  await assert.rejects(
    ciOpenVSCodeTerminal(plan, { env: { TERM_PROGRAM: "vscode" } }),
    /multiple VS Code windows/,
  );
  const before = process.cwd();
  await ciOpenVSCodeTerminal(
    { ...plan, cwd },
    {
      env: {
        TERM_PROGRAM: "vscode",
        CLOUDIGNITER_VSCODE_TERMINAL_ENDPOINT: original,
      },
    },
  );
  assert.equal(created[0].cwd, cwd);
  assert.equal(process.cwd(), before);
});

test("terminal host rejects unauthenticated, browser, outside, linked and untrusted requests", async (t) => {
  const { root, endpoint, plan, created, api } = await fixture(t);
  const request = async (body, headers = {}) =>
    fetch(`http://127.0.0.1:${endpoint.port}/terminal`, {
      method: "POST",
      headers: { Authorization: `Bearer ${endpoint.token}`, ...headers },
      body: JSON.stringify(body),
    });
  const body = {
    workspaceRoot: root,
    cwd: plan.cwd,
    name: "CloudIgniter: docs",
    preserveFocus: false,
  };
  assert.equal(
    (await request(body, { Authorization: "Bearer wrong" })).status,
    403,
  );
  assert.equal(
    (await request(body, { Origin: "http://localhost:9999" })).status,
    403,
  );
  assert.equal(
    (await request({ ...body, cwd: path.dirname(root) })).status,
    400,
  );
  assert.equal(
    (await request({ ...body, command: "arbitrary command" })).status,
    400,
  );
  await symlink(plan.cwd, path.join(root, "linked-docs"));
  assert.equal(
    (await request({ ...body, cwd: path.join(root, "linked-docs") })).status,
    400,
  );
  api.workspace.isTrusted = false;
  assert.equal((await request(body)).status, 400);
  assert.equal(created.length, 0);
});

test("failed shell startup is reported and disposes only the failed new terminal", async (t) => {
  const { plan, created } = await fixture(t, Promise.resolve(undefined));
  await assert.rejects(
    ciOpenVSCodeTerminal(plan, { env: { TERM_PROGRAM: "vscode" } }),
    /shell could not be started/,
  );
  assert.equal(created.length, 1);
  assert.equal(created[0].disposed, true);
});

test("helper discovers a parent checkout and nested workspace without following links", async (t) => {
  const { root } = await fixture(t);
  const folders = [
    { uri: { scheme: "file", fsPath: path.dirname(root) } },
    { uri: { scheme: "file", fsPath: path.join(root, "docs") } },
  ];
  assert.ok((await discoverRoots(folders)).includes(root));
});

test("first use installs only the bundled VSIX and waits for the terminal host", async (t) => {
  const root = await realpath(
    await mkdtemp(path.join(tmpdir(), "dev-vsix-first-use-")),
  );
  t.after(() => rm(root, { recursive: true, force: true }));
  let installed = false;
  await assert.rejects(
    ciOpenVSCodeTerminal(
      {
        kind: "terminal",
        terminal: "integrated",
        cwd: root,
        workspaceRoot: root,
      },
      {
        env: { TERM_PROGRAM: "vscode" },
        waitMs: 0,
        install: async (vsix) => {
          const bytes = await readFile(vsix);
          assert.equal(bytes.readUInt32LE(), 0x04034b50);
          assert.ok(bytes.includes(Buffer.from("extension/extension.cjs")));
          installed = true;
        },
      },
    ),
    /installed but inactive.*Reload Window/,
  );
  assert.equal(installed, true);
  const archive = path.join(root, "test.vsix");
  assert.equal(await ciWriteTerminalVSIX(archive), "0.1.0");
  await assert.rejects(ciWriteTerminalVSIX(archive), { code: "EEXIST" });
});
