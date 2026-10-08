import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { createServer } from "node:net";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { ciCreateWorkspacePlan } from "../src/workspace-commands.mjs";
import {
  ciRunWorkspaceServer,
  ciWorkspaceTerminalInvocation,
} from "../src/workspace-runtime.mjs";
import { ciStartWorkspaceStatic } from "../src/workspace-static.mjs";

const bin = path.resolve(import.meta.dirname, "../bin/dev.mjs");
const invoke = (args, cwd) =>
  spawnSync(process.execPath, [bin, ...args], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, TERM_PROGRAM: "dev-test" },
  });
async function workspace(t) {
  const root = await mkdtemp(path.join(tmpdir(), "dev-workspace-tools-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const directory of [
    "packages/dev",
    "packages/core/src",
    "docs",
    "apps/templates/cloudigniter-next-aws-v1",
  ])
    await mkdir(path.join(root, directory), { recursive: true });
  for (const [directory, manifest] of Object.entries({
    "": { name: "cloudigniter", private: true },
    "packages/dev": { name: "@cloudigniter/dev" },
    "packages/core": { name: "@cloudigniter/core" },
    docs: {
      name: "docs",
      dependencies: { "@docusaurus/core": "3.10.2" },
      scripts: { start: "docusaurus start -p 3010", serve: "docusaurus serve" },
    },
    "apps/templates/cloudigniter-next-aws-v1": {
      name: "@cloudigniter/cloudigniter-next-aws-v1",
      dependencies: { next: "16.2.2" },
      scripts: { dev: "pnpm generate && next dev", start: "next start" },
    },
  }))
    await writeFile(
      path.join(root, directory, "package.json"),
      JSON.stringify(manifest),
    );
  await writeFile(
    path.join(root, "pnpm-workspace.yaml"),
    "packages:\n  - packages/*\n  - apps/*\n  - docs\n",
  );
  return realpath(root);
}

async function website(t, target = "jodaris") {
  const directory = await realpath(await mkdtemp(path.join(tmpdir(), `dev-${target}-website-`)));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await writeFile(path.join(directory, "index.html"), target);
  await writeFile(path.join(directory, "publisher.config.json"), JSON.stringify({
    schemaVersion: 1, kind: "website", project: `${target}-website`, staticHosting: true, buildDirectories: ["dist"],
  }));
  return directory;
}

test("workspace commands resolve Docs from a nested package directory", async (t) => {
  const root = await workspace(t);
  const result = invoke(
    ["start", "docs", "--dry-run", "--json"],
    path.join(root, "packages/core/src"),
  );
  assert.equal(result.status, 0, result.stderr);
  const plan = JSON.parse(result.stdout);
  assert.equal(plan.cwd, path.join(root, "docs"));
  assert.equal(plan.port, 3010);
  assert.equal(plan.mode, "dev");
});

test("terminal package selection resolves the package root from another project", async (t) => {
  const root = await workspace(t);
  const result = invoke(
    ["open", "terminal", "@cloudigniter/core", "--dry-run", "--json"],
    path.join(root, "apps/templates/cloudigniter-next-aws-v1"),
  );
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).cwd, path.join(root, "packages/core"));
});

test("help advertises all convenience commands outside the workspace", () => {
  const result = invoke(["--help"], tmpdir());
  assert.equal(result.status, 0, result.stderr);
  for (const name of [
    "start docs",
    "start template",
    "start website jodaris",
    "start website cloudigniter",
    "open terminal",
  ])
    assert.ok(result.stdout.includes(`dev ${name}`), name);
});

test("all commands reject outside invocations, including discovery overrides", async (t) => {
  const root = await workspace(t);
  for (const input of [
    ["start", "docs"],
    ["start", "template"],
    ["start", "website", "jodaris"],
    ["start", "website", "cloudigniter"],
    ["open", "terminal"],
    ["open", "terminal", "core"],
  ]) {
    const result = invoke([...input, "--dry-run", "--json"], tmpdir());
    assert.equal(result.status, 2, result.stderr);
    assert.match(result.stderr, /inside the CloudIgniter Workspace/);
    const override = invoke(
      [...input, `--workspace-root=${root}`, "--dry-run"],
      tmpdir(),
    );
    assert.equal(override.status, 2, override.stderr);
    assert.match(override.stderr, /omit --workspace-root/);
  }
});

test("workspace commands also reject consumer pnpm projects and missing DEV", async (t) => {
  const root = await workspace(t);
  await writeFile(
    path.join(root, "package.json"),
    JSON.stringify({ name: "consumer", private: true }),
  );
  await assert.rejects(
    ciCreateWorkspacePlan(["open", "terminal"], {}, root),
    /CloudIgniter Workspace/,
  );
  await writeFile(
    path.join(root, "package.json"),
    JSON.stringify({ name: "cloudigniter", private: true }),
  );
  await rm(path.join(root, "packages/dev/package.json"));
  await assert.rejects(
    ciCreateWorkspacePlan(["start", "docs"], {}, root),
    /CloudIgniter Workspace/,
  );
});

test("terminal without an operand retains the invoking nested directory", async (t) => {
  const root = await workspace(t);
  const cwd = path.join(root, "packages/core/src");
  const plan = await ciCreateWorkspacePlan(["open", "terminal"], {}, cwd);
  assert.equal(plan.cwd, cwd);
  assert.equal(plan.workspaceRoot, root);
  for (const name of ["core", "@cloudigniter/core", "packages/core"]) {
    const selected = await ciCreateWorkspacePlan(
      ["open", "terminal", name],
      {},
      cwd,
    );
    assert.equal(selected.cwd, path.dirname(cwd));
    assert.equal(selected.package, "@cloudigniter/core");
  }
});

test("terminal plans open a new integrated terminal and external requires an option", async (t) => {
  const root = await workspace(t);
  const internal = invoke(
    ["open", "terminal", "core", "--dry-run", "--json"],
    root,
  );
  assert.equal(internal.status, 0, internal.stderr);
  assert.equal(JSON.parse(internal.stdout).terminal, "integrated");
  assert.equal(JSON.parse(internal.stdout).inPlace, undefined);
  const external = invoke(
    ["open", "terminal", "core", "--external", "--dry-run", "--json"],
    root,
  );
  assert.equal(external.status, 0, external.stderr);
  assert.equal(JSON.parse(external.stdout).terminal, "external");
});

test("terminal targets require explicit independent website selection", async (t) => {
  const root = await workspace(t);
  for (const name of ["jodaris", "cloudigniter"]) {
    const siteRoot = await website(t, name);
    await assert.rejects(ciCreateWorkspacePlan(["open", "terminal", name], {}, root), /--site-root/);
    await assert.rejects(ciCreateWorkspacePlan(["open", "terminal", name], { siteRoot }, root), /require --external/);
    const result = invoke(["open", "terminal", name, `--site-root=${siteRoot}`, "--external", "--dry-run", "--json"], root);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).cwd, siteRoot);
  }
  for (const [name, relative] of [["docs", "docs"], ["template", "apps/templates/cloudigniter-next-aws-v1"]]) {
    const plan = await ciCreateWorkspacePlan(["open", "terminal", name], {}, root);
    assert.equal(plan.cwd, path.join(root, relative));
  }
});

test("terminal discovery accepts app manifests and refuses unregistered folders", async (t) => {
  const root = await workspace(t);
  await mkdir(path.join(root, "apps/portal"));
  await writeFile(
    path.join(root, "apps/portal/package.json"),
    JSON.stringify({ name: "@cloudigniter/customer-portal" }),
  );
  await mkdir(path.join(root, "apps/unregistered"));
  for (const name of [
    "portal",
    "@cloudigniter/customer-portal",
    "apps/portal",
  ]) {
    const plan = await ciCreateWorkspacePlan(
      ["open", "terminal", name],
      {},
      root,
    );
    assert.equal(plan.cwd, path.join(root, "apps/portal"));
  }
  await assert.rejects(
    ciCreateWorkspacePlan(["open", "terminal", "unregistered"], {}, root),
    /not registered/,
  );
});

test("ambiguous terminal names require an explicit registered target path", async (t) => {
  const root = await workspace(t);
  await mkdir(path.join(root, "apps/core"));
  await writeFile(
    path.join(root, "apps/core/package.json"),
    JSON.stringify({ name: "application-core" }),
  );
  await assert.rejects(
    ciCreateWorkspacePlan(["open", "terminal", "core"], {}, root),
    /ambiguous/i,
  );
  assert.equal(
    (
      await ciCreateWorkspacePlan(
        ["open", "terminal", "packages/core"],
        {},
        root,
      )
    ).cwd,
    path.join(root, "packages/core"),
  );
  assert.equal(
    (await ciCreateWorkspacePlan(["open", "terminal", "apps/core"], {}, root))
      .cwd,
    path.join(root, "apps/core"),
  );
});

test("terminal discovery supports additional provider templates without repository mappings", async (t) => {
  const root = await workspace(t);
  const relative = "apps/templates/cloudigniter-next-azure-v1";
  await mkdir(path.join(root, relative), { recursive: true });
  await writeFile(path.join(root, relative, "package.json"), JSON.stringify({ name: "@cloudigniter/cloudigniter-next-azure-v1" }));
  for (const target of [relative, "cloudigniter-next-azure-v1", "@cloudigniter/cloudigniter-next-azure-v1"])
    assert.equal((await ciCreateWorkspacePlan(["open", "terminal", target], {}, root)).cwd, path.join(root, relative));
});

test("terminal app registration rejects linked metadata and traversal", async (t) => {
  const root = await workspace(t);
  await mkdir(path.join(root, "apps/site"));
  await writeFile(
    path.join(root, "site-metadata.json"),
    JSON.stringify({ schemaVersion: 1, label: "Site", kind: "website" }),
  );
  await symlink(
    path.join(root, "site-metadata.json"),
    path.join(root, "apps/site/publisher.config.json"),
  );
  await assert.rejects(
    ciCreateWorkspacePlan(["open", "terminal", "site"], {}, root),
    /symbolic links/,
  );
  const result = invoke(
    ["open", "terminal", "apps/../docs", "--dry-run"],
    root,
  );
  assert.equal(result.status, 2);
});

test("integrated terminal requires VS Code and rejects the old in-place option", async (t) => {
  const root = await workspace(t);
  const piped = invoke(["open", "terminal", "core"], root);
  assert.equal(piped.status, 2, piped.stderr);
  assert.match(piped.stderr, /VS Code.*--external/i);
  const conflicting = invoke(
    ["open", "terminal", "core", "--external", "--in-place", "--dry-run"],
    root,
  );
  assert.equal(conflicting.status, 2, conflicting.stderr);
  assert.match(conflicting.stderr, /in-place/i);
});

test("Next plans retain package scripts and forward port/host with an existing-build mode", async (t) => {
  const root = await workspace(t);
  const dev = await ciCreateWorkspacePlan(
    ["start", "template"],
    {},
    path.join(root, "docs"),
  );
  assert.equal(dev.framework, "next");
  assert.equal(dev.port, 3000);
  assert.deepEqual(dev.args, [
    "run",
    "dev",
    "--port",
    "3000",
    "--hostname",
    "127.0.0.1",
  ]);
  const prod = await ciCreateWorkspacePlan(
    ["start", "template"],
    { mode: "prod", port: 4500, host: "0.0.0.0", open: false },
    root,
  );
  assert.deepEqual(prod.args, [
    "run",
    "start",
    "--port",
    "4500",
    "--hostname",
    "0.0.0.0",
  ]);
  assert.equal(prod.url, "http://127.0.0.1:4500/");
  assert.equal(prod.open, false);
  assert.equal(prod.mode, "prod");
  const manifest = JSON.parse(
    await readFile(path.join(root, "apps/templates/cloudigniter-next-aws-v1/package.json"), "utf8"),
  );
  assert.equal(manifest.scripts.dev, "pnpm generate && next dev");
});

test("Docs and template restart only on their default ports, including explicit defaults", async (t) => {
  const root = await workspace(t);
  for (const [target, port] of [["docs", 3010], ["template", 3000]]) {
    for (const flags of [{}, { port }]) {
      const plan = await ciCreateWorkspacePlan(["start", target], flags, root);
      assert.equal(plan.restartOnBusy, true, target);
    }
    const custom = await ciCreateWorkspacePlan(["start", target], { port: 4500 }, root);
    assert.equal(custom.restartOnBusy, false, target);
  }
  const siteRoot = await website(t);
  const plan = await ciCreateWorkspacePlan(["start", "website", "jodaris"], { siteRoot }, root);
  assert.equal(plan.restartOnBusy, false);
});

test("Docs production requires an existing build and uses serve", async (t) => {
  const root = await workspace(t);
  await assert.rejects(
    ciCreateWorkspacePlan(["start", "docs"], { mode: "prod" }, root),
    /Build Docs first/,
  );
  await mkdir(path.join(root, "docs/build"));
  await writeFile(path.join(root, "docs/build/index.html"), "built");
  const plan = await ciCreateWorkspacePlan(
    ["start", "docs"],
    { mode: "prod", host: "::", port: 3020 },
    root,
  );
  assert.deepEqual(plan.args, [
    "run",
    "serve",
    "--port",
    "3020",
    "--host",
    "::",
    "--no-open",
  ]);
  assert.equal(plan.url, "http://[::1]:3020/");
});

test("independent websites support static preview and later Next applications", async (t) => {
  const root = await workspace(t);
  for (const target of ["jodaris", "cloudigniter"]) {
    const siteRoot = await website(t, target);
    await assert.rejects(ciCreateWorkspacePlan(["start", "website", target], {}, root), /--site-root/);
    const staticSite = await ciCreateWorkspacePlan(["start", "website", target], { siteRoot }, root);
    assert.equal(staticSite.framework, "static");
    assert.equal(staticSite.cwd, siteRoot);
    assert.equal(staticSite.port, target === "jodaris" ? 3001 : 3002);
    await assert.rejects(ciCreateWorkspacePlan(["start", "website", target], { siteRoot, mode: "prod" }, root), /Build the static site/);
    await mkdir(path.join(siteRoot, "dist"));
    await writeFile(path.join(siteRoot, "dist/index.html"), "built");
    const prod = await ciCreateWorkspacePlan(["start", "website", target], { siteRoot, mode: "prod" }, root);
    assert.equal(prod.args[1], path.join(siteRoot, "dist"));
    await writeFile(path.join(siteRoot, "package.json"), JSON.stringify({dependencies: {next: "16.2.2"}, scripts: {dev: "next dev", start: "next start"}}));
    const next = await ciCreateWorkspacePlan(["start", "website", target], { siteRoot, mode: "prod" }, root);
    assert.equal(next.framework, "next");
    assert.equal(next.args[1], "start");
  }
});

test("website selection rejects workspace paths, links and mismatched identities", async (t) => {
  const root = await workspace(t);
  const siteRoot = await website(t);
  await assert.rejects(ciCreateWorkspacePlan(["start", "website", "jodaris"], { siteRoot: root }, root), /outside the integration workspace/);
  await assert.rejects(ciCreateWorkspacePlan(["start", "website", "cloudigniter"], { siteRoot }, root), /metadata must select/);
  await assert.rejects(ciCreateWorkspacePlan(["start", "docs"], { siteRoot }, root), /only for/);
  const linked = path.join(root, "linked-site");
  await symlink(siteRoot, linked);
  await assert.rejects(ciCreateWorkspacePlan(["start", "website", "jodaris"], { siteRoot: linked }, root), /symbolic links/);
});

test("bad arguments, flags, paths and server options fail before launches", async (t) => {
  const root = await workspace(t);
  for (const input of [
    ["start", "docs", "extra"],
    ["start", "website"],
    ["start", "website", "other"],
    ["open", "terminal", "core", "extra"],
    ["open", "terminal", "../../other"],
    ["open", "terminal", "missing"],
  ])
    await assert.rejects(ciCreateWorkspacePlan(input, {}, root));
  for (const port of [0, -1, 1.5, 65536, NaN])
    await assert.rejects(
      ciCreateWorkspacePlan(["start", "docs"], { port }, root),
      /--port/,
    );
  await assert.rejects(
    ciCreateWorkspacePlan(["start", "docs"], { host: "localhost;bad" }, root),
    /--host/,
  );
  await assert.rejects(
    ciCreateWorkspacePlan(["start", "docs"], { mode: "other" }, root),
    /--mode/,
  );
  for (const args of [
    ["start", "docs", "--in-place"],
    ["start", "docs", "--external"],
    ["open", "terminal", "--port=4000"],
    ["start", "template", "--profile=developer"],
    ["start", "docs", "--json"],
    ["open", "terminal", "--unknown"],
  ]) {
    const result = invoke(args, root);
    assert.equal(result.status, 2, result.stdout + result.stderr);
  }
});

test("workspace selection refuses symlinked sources and manifests", async (t) => {
  const root = await workspace(t);
  await rm(path.join(root, "docs"), { recursive: true });
  await symlink(path.join(root, "apps/templates/cloudigniter-next-aws-v1"), path.join(root, "docs"));
  await assert.rejects(
    ciCreateWorkspacePlan(["start", "docs"], {}, root),
    /symbolic links/,
  );
  await symlink(
    path.join(root, "packages/dev/package.json"),
    path.join(root, "packages/core/linked.json"),
  );
  await rm(path.join(root, "packages/core/package.json"));
  await symlink(
    path.join(root, "packages/core/linked.json"),
    path.join(root, "packages/core/package.json"),
  );
  await assert.rejects(
    ciCreateWorkspacePlan(["open", "terminal", "core"], {}, root),
    /symbolic links/,
  );
});

test("terminal adapters pass special-character directories as arguments", () => {
  const cwd = "/tmp/CloudIgniter 'quoted' $HOME; workspace";
  const mac = ciWorkspaceTerminalInvocation(cwd, "darwin", "/bin/zsh");
  assert.equal(mac.command, "osascript");
  assert.equal(mac.args.at(-2), cwd);
  assert.ok(!mac.args[1].includes(cwd));
  assert.match(mac.args[1], /quoted form/);
  const windows = ciWorkspaceTerminalInvocation(cwd, "win32");
  assert.equal(windows.command, "wt.exe");
  assert.equal(windows.args.at(-1), cwd);
  const linux = ciWorkspaceTerminalInvocation(cwd, "linux", "/bin/bash");
  assert.equal(linux.command, "x-terminal-emulator");
  assert.deepEqual(linux.args, ["-e", "/bin/bash", "-l"]);
});

async function freePort() {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

test("static preview serves public assets but never project/private files or symlinks", async (t) => {
  const root = await workspace(t);
  await writeFile(path.join(root, "index.html"), "<h1>public</h1>");
  await writeFile(path.join(root, ".env"), "PRIVATE=secret");
  await mkdir(path.join(root, "assets"));
  await writeFile(path.join(root, "assets/style.css"), "body{}");
  await symlink(path.join(root, ".env"), path.join(root, "assets/linked.css"));
  const server = await ciStartWorkspaceStatic(root, "127.0.0.1", 0);
  t.after(() => {
    server.closeAllConnections();
    server.close();
  });
  const url = `http://127.0.0.1:${server.address().port}`;
  assert.equal(await (await fetch(url)).text(), "<h1>public</h1>");
  const css = await fetch(`${url}/assets/style.css`);
  assert.equal(css.headers.get("content-type"), "text/css; charset=utf-8");
  for (const relative of [
    ".env",
    "package.json",
    "scripts/private.js",
    "assets/linked.css",
    "assets/%2e%2e%2f.env",
    "assets/%ZZ",
  ])
    assert.equal((await fetch(`${url}/${relative}`)).status, 404, relative);
  assert.equal((await fetch(url, { method: "POST" })).status, 405);
});

test("server runtime opens the browser after readiness and preserves failure status", async (t) => {
  const root = await workspace(t);
  const base = await ciCreateWorkspacePlan(["start", "template"], {}, root);
  let accepting = false;
  let opened = 0;
  await ciRunWorkspaceServer(
    {
      ...base,
      port: await freePort(),
      command: process.execPath,
      args: ["-e", "setTimeout(() => process.exit(0), 450)"],
    },
    {
      log: () => {},
      ready: async () => {
        await delay(150);
        accepting = true;
        return true;
      },
      open: async () => {
        assert.equal(accepting, true);
        opened++;
      },
    },
  );
  assert.equal(opened, 1);
  await assert.rejects(
    ciRunWorkspaceServer(
      {
        ...base,
        port: await freePort(),
        command: process.execPath,
        args: ["-e", "process.exit(23)"],
      },
      {
        log: () => {},
        ready: async () => {
          await delay(150);
          return false;
        },
        open: async () => opened++,
      },
    ),
    (error) => error.exitCode === 23,
  );
  assert.equal(opened, 1);
  await ciRunWorkspaceServer(
    {
      ...base,
      open: false,
      port: await freePort(),
      command: process.execPath,
      args: ["-e", "setTimeout(() => process.exit(0), 200)"],
    },
    { log: () => {}, ready: async () => true, open: async () => opened++ },
  );
  assert.equal(opened, 1);
});

for (const target of ["docs", "template"]) {
  test(`${target} restart waits for delayed port release before launching the replacement`, async (t) => {
    const root = await workspace(t);
    const plan = await ciCreateWorkspacePlan(["start", target], {}, root);
    const marker = path.join(root, "replacement-started");
    let probes = 0;
    let released = false;
    let observedBusy;
    const messages = [];
    await ciRunWorkspaceServer(
      {
        ...plan,
        port: await freePort(),
        command: process.execPath,
        args: ["-e", `require('node:fs').writeFileSync(${JSON.stringify(marker)}, 'started')`],
        open: false,
      },
      {
        log: (text) => messages.push(text),
        portAvailable: async () => {
          probes++;
          if (probes === 1) return true;
          if (probes < 4) return false;
          released = true;
          return true;
        },
        ready: async () => {
          observedBusy = !released;
          return true;
        },
      },
    );
    assert.equal(released, true, "The replacement must wait until the port can be bound.");
    assert.equal(observedBusy, false);
    assert.equal(await readFile(marker, "utf8"), "started");
    assert.match(messages.join("\n"), /Waiting.*port.*released/);
  });
}

test("a port that remains busy after restart fails before starting a child or browser", async (t) => {
  const root = await workspace(t);
  const plan = await ciCreateWorkspacePlan(["start", "docs"], {}, root);
  const marker = path.join(root, "replacement-started");
  let probes = 0;
  await assert.rejects(
    ciRunWorkspaceServer(
      {
        ...plan,
        port: await freePort(),
        command: process.execPath,
        args: ["-e", `require('node:fs').writeFileSync(${JSON.stringify(marker)}, 'started')`],
      },
      {
        log: () => {},
        portAvailable: async () => ++probes === 1,
        portReleaseTimeoutMs: 0,
        open: async () => assert.fail("Opened browser while port was unavailable"),
      },
    ),
    /port did not become available/,
  );
  await assert.rejects(readFile(marker), { code: "ENOENT" });
});

test("busy ports fail without starting a child or browser", async (t) => {
  const root = await workspace(t);
  const occupied = createServer();
  occupied.listen(0, "127.0.0.1");
  await once(occupied, "listening");
  t.after(() => occupied.close());
  const base = await ciCreateWorkspacePlan(["start", "template"], {}, root);
  await assert.rejects(
    ciRunWorkspaceServer(
      { ...base, port: occupied.address().port, command: "not-a-command" },
      { open: async () => assert.fail("Opened browser") },
    ),
    /port may already be in use/,
  );
});

test("stopping a started website exits with 130 and releases its port", async (t) => {
  const root = await workspace(t);
  const siteRoot = await website(t);
  const port = await freePort();
  const child = spawn(
    process.execPath,
    [bin, "start", "website", "jodaris", `--site-root=${siteRoot}`, `--port=${port}`, "--no-open"],
    {
      cwd: path.join(root, "packages/core/src"),
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  t.after(() => child.kill("SIGTERM"));
  const closed = once(child, "close");
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      if ((await fetch(`http://127.0.0.1:${port}/`)).status === 200) break;
    } catch {}
    if (attempt === 39) assert.fail("Static child did not start");
    await delay(100);
  }
  child.kill("SIGTERM");
  const [code] = await closed;
  assert.equal(code, 130);
  await assert.rejects(fetch(`http://127.0.0.1:${port}/`));
});
