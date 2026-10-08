import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { ciRunWorkspaceServer } from "../src/workspace-runtime.mjs";

async function fixture(t, framework, options = {}) {
  const workspaceRoot = await mkdtemp(path.join(tmpdir(), "dev-restart-"));
  const cwd = path.join(workspaceRoot, framework === "next" ? "apps/templates/cloudigniter-next-aws-v1" : "docs");
  await mkdir(path.join(cwd, "node_modules/.bin"), { recursive: true });
  const host = options.host ?? "127.0.0.1";
  const probe = createServer();
  probe.listen(0, host);
  await once(probe, "listening");
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  const cli = path.join(cwd, "node_modules/.bin", `${options.unrelated ? "server" : framework === "next" ? "next" : "docusaurus"}.mjs`);
  const server = `
    const http = require('node:http');
    ${options.ignoreTerm ? "process.on('SIGTERM', () => {});" : ""}
    http.createServer((request, response) => response.end(String(process.pid)))
      .listen(${port}, ${JSON.stringify(host)});
  `;
  await writeFile(cli, framework === "next" ? `
    import { spawn } from 'node:child_process';
    const worker = spawn(process.execPath, ['-e', ${JSON.stringify(server)}], { stdio: 'inherit' });
    // Exercise a CLI wrapper whose listener lives in a descendant process.
    setInterval(() => {}, 1000);
  ` : `import { createRequire } from 'node:module';
    const require = createRequire(import.meta.url); ${server}`);
  const child = spawn(process.execPath, [cli, framework === "next" ? "dev" : "start"], {
    cwd, stdio: "ignore",
  });
  const closed = once(child, "close");
  let listener;
  t.after(async () => {
    child.kill("SIGKILL");
    if (listener && listener !== child.pid) {
      try { process.kill(listener, "SIGKILL"); } catch {}
    }
    await closed;
    await rm(workspaceRoot, { recursive: true, force: true });
  });
  const url = `http://${host === "::1" ? "[::1]" : host}:${port}/`;
  for (let attempt = 0; attempt < 60; attempt++) {
    try { listener = Number(await (await fetch(url)).text()); break; } catch {}
    await delay(50);
  }
  assert.ok(listener, "Fixture server did not start");
  const started = path.join(workspaceRoot, "replacement.json");
  const replacement = `
    const http = require('node:http');
    const fs = require('node:fs');
    const server = http.createServer((request, response) => response.end('replacement'));
    server.listen(${port}, '127.0.0.1', () => {
      fs.writeFileSync(${JSON.stringify(started)}, JSON.stringify({ port: server.address().port }));
      setTimeout(() => { server.closeAllConnections(); server.close(); }, 350);
    });
  `;
  return {
    child, closed, listener, started,
    plan: { kind: "server", workspaceRoot, target: framework === "next" ? "template" : "docs",
      framework, mode: "dev", cwd, port, host: "127.0.0.1", url,
      command: process.execPath, args: ["-e", replacement], open: false, restartOnBusy: true },
  };
}

for (const framework of ["docusaurus", "next"]) {
  test(`occupied default port restarts the matching ${framework} server and its listener`, { timeout: 15000 }, async t => {
    const f = await fixture(t, framework);
    const messages = [];
    await ciRunWorkspaceServer(f.plan, { log: text => messages.push(text) });
    assert.equal(JSON.parse(await readFile(f.started, "utf8")).port, f.plan.port);
    const [code, signal] = await f.closed;
    assert.ok(signal === "SIGTERM" || code === 0);
    assert.throws(() => process.kill(f.listener, 0), { code: "ESRCH" });
    assert.match(messages.join("\n"), /Restarting/);
  });
}

test("restart escalates a matching unresponsive server and waits for port release", { timeout: 15000 }, async t => {
  const f = await fixture(t, "docusaurus", { ignoreTerm: true });
  await ciRunWorkspaceServer(f.plan, { log: () => {} });
  assert.equal((await f.closed)[1], "SIGKILL");
  assert.equal(JSON.parse(await readFile(f.started, "utf8")).port, f.plan.port);
});

test("restart refuses the same framework in another checkout without stopping it", async t => {
  const f = await fixture(t, "docusaurus");
  await assert.rejects(ciRunWorkspaceServer({ ...f.plan, cwd: path.join(f.plan.workspaceRoot, "other-docs") }, {
    log: () => {}, open: async () => assert.fail("Opened browser"),
  }), /port may already be in use|unrelated|verified/i);
  assert.equal(Number(await (await fetch(f.plan.url)).text()), f.listener);
  await assert.rejects(readFile(f.started), { code: "ENOENT" });
});

test("a custom port collision never restarts even the matching server", async t => {
  const f = await fixture(t, "next");
  await assert.rejects(ciRunWorkspaceServer({ ...f.plan, restartOnBusy: false }, {
    log: () => {},
  }), /port may already be in use/);
  assert.equal(Number(await (await fetch(f.plan.url)).text()), f.listener);
  await assert.rejects(readFile(f.started), { code: "ENOENT" });
});

test("an unrelated service in the same project is left running", async t => {
  const f = await fixture(t, "docusaurus", { unrelated: true });
  await assert.rejects(ciRunWorkspaceServer(f.plan, { log: () => {} }), /unrelated or unverified/);
  assert.equal(Number(await (await fetch(f.plan.url)).text()), f.listener);
  await assert.rejects(readFile(f.started), { code: "ENOENT" });
});

test("restart launches the requested production mode after stopping development", async t => {
  const f = await fixture(t, "docusaurus");
  const messages = [];
  await ciRunWorkspaceServer({ ...f.plan, mode: "prod" }, { log: text => messages.push(text) });
  assert.match(messages.join("\n"), /docs \(prod\)/);
  assert.equal(JSON.parse(await readFile(f.started, "utf8")).port, f.plan.port);
});

test("default-port restart detects an IPv6 localhost server when starting on IPv4", async t => {
  const f = await fixture(t, "docusaurus", { host: "::1" });
  await ciRunWorkspaceServer({ ...f.plan, url: `http://127.0.0.1:${f.plan.port}/` }, { log: () => {} });
  assert.throws(() => process.kill(f.listener, 0), { code: "ESRCH" });
  assert.equal(JSON.parse(await readFile(f.started, "utf8")).port, f.plan.port);
});

test("CLI dry-run leaves an existing Docs server running without launching a replacement", async t => {
  const f = await fixture(t, "docusaurus");
  const root = f.plan.workspaceRoot;
  await mkdir(path.join(root, "packages/dev"), { recursive: true });
  for (const [directory, manifest] of Object.entries({
    "": { name: "cloudigniter", private: true },
    "packages/dev": { name: "@cloudigniter/dev" },
    docs: { name: "docs", dependencies: { "@docusaurus/core": "3.10.2" }, scripts: { start: "docusaurus start" } },
  })) await writeFile(path.join(root, directory, "package.json"), JSON.stringify(manifest));
  await writeFile(path.join(root, "pnpm-workspace.yaml"), "packages:\n  - packages/*\n  - docs\n");
  const cli = spawn(process.execPath, [path.resolve(import.meta.dirname, "../bin/dev.mjs"),
    "start", "docs", "--dry-run", "--json"], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
  let stdout = "";
  let stderr = "";
  cli.stdout.on("data", data => stdout += data);
  cli.stderr.on("data", data => stderr += data);
  const [code] = await once(cli, "close");
  assert.equal(code, 0, stderr);
  assert.equal(JSON.parse(stdout).restartOnBusy, true);
  assert.equal(Number(await (await fetch(f.plan.url)).text()), f.listener);
  await assert.rejects(readFile(f.started), { code: "ENOENT" });
});
