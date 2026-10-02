import http from "node:http";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { randomBytes, randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { execa } from "execa";
import { ciAssertDeveloperWorkspace } from "./maintainer-runtime.mjs";
import { ciIsRecord } from "./policy.mjs";
import { CiDevUsageError, ciErrorMessage } from "./runtime.mjs";
import {
  ciPublisherWorkspace,
  ciPublisherIdentity,
  ciPublisherHash,
  ciPublisherConfigFiles,
  ciPublisherReadConfig,
  ciPublisherSaveConfig,
  ciPublisherBuildTree,
} from "./publisher-workspace.mjs";
import { ciPublisherActions, ciPublisherPlan } from "./publisher-actions.mjs";
import { CiPublisherJobs, ciPublisherRedact } from "./publisher-jobs.mjs";
import { ciPublisherEditorAssets } from "./publisher-editor.mjs";
import { ciPublisherFeedbackAsset } from "./publisher-feedback.mjs";

const assets = fileURLToPath(new URL("./publisher/assets/", import.meta.url));
/** @param {unknown} value */
function string(value) {
  if (typeof value !== "string")
    throw new CiDevUsageError("Expected a string value.");
  return value;
}
/** @param {http.IncomingMessage} request */
async function body(request) {
  if (!request.headers["content-type"]?.startsWith("application/json"))
    throw new CiDevUsageError("Use application/json.");
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 1_100_000) throw new CiDevUsageError("Request exceeds 1 MiB.");
    chunks.push(chunk);
  }
  const value = JSON.parse(Buffer.concat(chunks).toString());
  if (!ciIsRecord(value)) throw new CiDevUsageError("Expected a JSON object.");
  return value;
}

/** Local-only company tooling. There is intentionally no remote-host option.
 * @param {{root:string,port?:number,profile?:string,sessionTtlMs?:number}} options
 */
export async function ciStartPublisher({
  root,
  port = 4310,
  profile,
  sessionTtlMs = 8 * 60 * 60 * 1000,
}) {
  root = await ciAssertDeveloperWorkspace(root);
  if (!Number.isInteger(port) || port < 0 || port > 65535)
    throw new CiDevUsageError(
      "Publisher port must be an integer from 0 to 65535.",
    );
  const initial = await ciPublisherWorkspace(root);
  let selected =
    profile ??
    process.env.CLOUDIGNITER_PROFILE ??
    (Object.hasOwn(initial.profiles, "developer") ? "developer" : null);
  if (selected && !Object.hasOwn(initial.profiles, selected))
    throw new CiDevUsageError("Unknown Publisher GitHub profile.");
  const token = randomBytes(32).toString("base64url");
  const expires = Date.now() + sessionTtlMs;
  const jobs = new CiPublisherJobs();
  /** @type {Map<string,{expires:number,target:string,action:string,input:Record<string,unknown>,fingerprint:string}>} */ const plans =
    new Map();
  let origin = "";
  let mutating = false;
  let stopping = false;
  /** @type {Promise<unknown> | undefined} */ let mutation;
  /** @type {Promise<void> | undefined} */ let shutdown;
  /** @type {Promise<void> | undefined} */ let closure;
  /** @param {()=>Promise<unknown>} work */
  async function exclusive(work) {
    if (stopping || mutating || jobs.busy())
      throw new CiDevUsageError(
        "Another action is running. Wait for it to finish.",
      );
    mutating = true;
    try {
      mutation = work();
      return await mutation;
    } finally {
      mutating = false;
      mutation = undefined;
    }
  }
  /** @param {string} targetId @param {string} action @param {Record<string,unknown>} input */
  async function plan(targetId, action, input) {
    const workspace = await ciPublisherWorkspace(root);
    const target = workspace.targets.find((t) => t.id === targetId);
    if (!target)
      throw new CiDevUsageError("Target no longer exists in the workspace.");
    const result = await ciPublisherPlan(root, target, action, input, selected);
    return {
      result,
      fingerprint: ciPublisherHash(
        JSON.stringify({
          result,
          target,
          release: workspace.release,
          profiles: workspace.profiles,
        }),
      ),
    };
  }
  const server = http.createServer(async (request, response) => {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'; object-src 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; worker-src 'self'",
    );
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Referrer-Policy", "no-referrer");
    response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    /** @param {number} status @param {unknown} value */
    const json = (status, value) => {
      response.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
      });
      response.end(JSON.stringify(value));
    };
    try {
      if (
        request.headers.host !== new URL(origin).host ||
        !["127.0.0.1", "::ffff:127.0.0.1"].includes(
          request.socket.remoteAddress ?? "",
        ) ||
        (request.headers.origin && request.headers.origin !== origin) ||
        request.headers["sec-fetch-site"] === "cross-site"
      ) {
        json(403, {
          error: "Publisher only accepts same-origin loopback requests.",
        });
        return;
      }
      const url = new URL(request.url ?? "/", origin);
      if (!url.pathname.startsWith("/api/")) {
        if (url.pathname === "/feedback.js" && request.method === "GET") {
          const asset = await ciPublisherFeedbackAsset();
          response.writeHead(200, { "Content-Type": asset.type });
          response.end(asset.content);
          return;
        }
        if (url.pathname.startsWith("/editor/") && request.method === "GET") {
          const editorAsset = (await ciPublisherEditorAssets()).get(
            url.pathname,
          );
          if (!editorAsset) {
            json(404, { error: "Not found." });
            return;
          }
          response.writeHead(200, { "Content-Type": editorAsset.type });
          response.end(editorAsset.content);
          return;
        }
        const file = /** @type {Record<string,[string,string]>} */ ({
          "/": ["index.html", "text/html"],
          "/publisher.js": ["publisher.js", "text/javascript"],
          "/navigation.mjs": ["navigation.mjs", "text/javascript"],
          "/theme.mjs": ["theme.mjs", "text/javascript"],
          "/editor.mjs": ["editor.mjs", "text/javascript"],
          "/discard.mjs": ["discard.mjs", "text/javascript"],
          "/publisher.css": ["publisher.css", "text/css"],
        })[url.pathname];
        if (!file || request.method !== "GET") {
          json(404, { error: "Not found." });
          return;
        }
        response.writeHead(200, {
          "Content-Type": `${file[1]}; charset=utf-8`,
        });
        response.end(await readFile(path.join(assets, file[0])));
        return;
      }
      if (
        Date.now() >= expires ||
        request.headers.authorization !== `Bearer ${token}`
      ) {
        json(401, {
          error:
            "Publisher session expired or missing. Reopen the URL printed by dev publisher.",
        });
        return;
      }
      const key = `${request.method} ${url.pathname}`;
      if (stopping) {
        json(503, { error: "Publisher is shutting down." });
        return;
      }
      if (key === "GET /api/workspace") {
        const workspace = await ciPublisherWorkspace(root);
        json(200, {
          ...workspace,
          targets: workspace.targets.map((t) => ({
            ...t,
            actions: ciPublisherActions(t),
          })),
          selectedProfile: selected,
          busy: jobs.busy(),
          expiresAt: new Date(expires).toISOString(),
        });
      } else if (key === "GET /api/identity")
        json(200, await ciPublisherIdentity(root, selected ?? undefined));
      else if (key === "GET /api/jobs") json(200, jobs.jobs);
      else if (key === "GET /api/configs")
        json(
          200,
          await ciPublisherConfigFiles(
            root,
            url.searchParams.get("target") ?? undefined,
          ),
        );
      else if (key === "GET /api/config")
        json(
          200,
          await ciPublisherReadConfig(root, url.searchParams.get("file") ?? ""),
        );
      else if (key === "GET /api/build")
        json(
          200,
          await ciPublisherBuildTree(
            root,
            url.searchParams.get("target") ?? "",
          ),
        );
      else if (key === "POST /api/config") {
        const value = await body(request);
        json(
          200,
          await exclusive(() =>
            ciPublisherSaveConfig(
              root,
              string(value.file),
              string(value.content),
              string(value.revision),
            ),
          ),
        );
        plans.clear();
      } else if (key === "POST /api/profile") {
        const value = await body(request);
        const result = await exclusive(async () => {
          const name = value.profile === null ? null : string(value.profile);
          const workspace = await ciPublisherWorkspace(root);
          if (name && !Object.hasOwn(workspace.profiles, name))
            throw new CiDevUsageError("Unknown GitHub profile.");
          const identity = await ciPublisherIdentity(root, name ?? undefined);
          if (!identity.selected.verified)
            throw new CiDevUsageError(identity.selected.error);
          selected = name;
          plans.clear();
          return identity;
        });
        json(200, result);
      } else if (key === "POST /api/plan") {
        const value = await body(request);
        if (!ciIsRecord(value.input))
          throw new CiDevUsageError("Action inputs must be an object.");
        const target = string(value.target),
          action = string(value.action),
          input = value.input;
        const prepared = await plan(target, action, input);
        const id = randomUUID();
        for (const [key, p] of plans)
          if (p.expires < Date.now()) plans.delete(key);
        if (plans.size >= 30) plans.clear();
        plans.set(id, {
          expires: Date.now() + 120_000,
          target,
          action,
          input,
          fingerprint: prepared.fingerprint,
        });
        json(200, { id, ...prepared.result });
      } else if (key === "POST /api/run") {
        const value = await body(request);
        const result = await exclusive(async () => {
          const id = string(value.id),
            stored = plans.get(id);
          plans.delete(id);
          if (!stored || stored.expires < Date.now())
            throw new CiDevUsageError(
              "Preview expired. Review the command again.",
            );
          const prepared = await plan(
            stored.target,
            stored.action,
            stored.input,
          );
          if (prepared.fingerprint !== stored.fingerprint)
            throw new CiDevUsageError(
              "Configuration or identity changed. Review a fresh preview.",
            );
          return jobs.start(prepared.result);
        });
        json(202, result);
      } else if (key === "POST /api/shutdown") {
        const value = await body(request);
        if (value.confirmed !== true)
          throw new CiDevUsageError(
            "Confirm closing Publisher before shutting down.",
          );
        await prepareShutdown();
        response.once("finish", () => {
          void close();
        });
        response.setHeader("Connection", "close");
        json(200, { status: "closed" });
      } else if (key === "POST /api/cancel") {
        const value = await body(request);
        jobs.cancel(string(value.id));
        json(200, { status: "cancelling" });
      } else json(404, { error: "Unknown Publisher endpoint." });
    } catch (error) {
      json(
        error instanceof CiDevUsageError || error instanceof SyntaxError
          ? 400
          : 500,
        { error: ciPublisherRedact(ciErrorMessage(error)) },
      );
    }
  });
  server.requestTimeout = 15_000;
  server.headersTimeout = 10_000;
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve(undefined));
  });
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Publisher failed to bind a local port.");
  origin = `http://127.0.0.1:${address.port}`;
  const closed = new Promise((resolve) => server.once("close", resolve));
  function prepareShutdown() {
    if (!shutdown) {
      stopping = true;
      plans.clear();
      shutdown = (async () => {
        // Let an already accepted file save/profile change finish before stopping work.
        await mutation?.catch(() => undefined);
        await jobs.stop();
      })();
    }
    return shutdown;
  }
  function close() {
    if (!closure)
      closure = (async () => {
        await prepareShutdown();
        await new Promise((resolve) => {
          server.close(resolve);
          server.closeIdleConnections();
          const timer = setTimeout(() => server.closeAllConnections(), 1000);
          timer.unref();
          server.once("close", () => clearTimeout(timer));
        });
      })();
    return closure;
  }
  return {
    server,
    jobs,
    url: `${origin}/#session=${token}`,
    origin,
    token,
    close,
    closed,
  };
}

/** @param {{workspaceRoot?:string,port?:number,open?:boolean,profile?:string}} flags */
export async function ciRunPublisher(flags) {
  const publisher = await ciStartPublisher({
    root: flags.workspaceRoot ?? process.cwd(),
    port: flags.port,
    profile: flags.profile,
  });
  console.log(
    `CloudIgniter Publisher\n${publisher.url}\nLocal session expires in 8 hours. Use Close in Publisher or press Ctrl+C to stop.`,
  );
  if (flags.open !== false) {
    const command =
      process.platform === "darwin"
        ? "open"
        : process.platform === "win32"
          ? "rundll32"
          : "xdg-open";
    const args =
      process.platform === "win32"
        ? ["url.dll,FileProtocolHandler", publisher.url]
        : [publisher.url];
    await execa(command, args, { shell: false, reject: false }).catch(
      () => undefined,
    );
  }
  const stop = () => {
    void publisher.close();
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  try {
    await publisher.closed;
  } finally {
    process.off("SIGINT", stop);
    process.off("SIGTERM", stop);
  }
}
