import { readFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";

const CI_ASSET_ROOT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "assets",
);
const CI_SESSION_COOKIE = "ci_resource_studio_session";
const CI_MAX_BODY_BYTES = 1024 * 1024;
const CI_BOOTSTRAP_TTL_MS = 5 * 60 * 1_000;
const CI_SESSION_TTL_MS = 8 * 60 * 60 * 1_000;

function ciRandomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

function ciSecurityHeaders(contentType) {
  return {
    "Cache-Control": "no-store",
    "Content-Security-Policy":
      "default-src 'self'; base-uri 'none'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; object-src 'none'; script-src 'self'; style-src 'self'",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    ...(contentType ? { "Content-Type": contentType } : {}),
  };
}

function ciJson(response, statusCode, value, headers = {}) {
  response.writeHead(statusCode, {
    ...ciSecurityHeaders("application/json; charset=utf-8"),
    ...headers,
  });
  response.end(`${JSON.stringify(value)}\n`);
}

function ciErrorPayload(error) {
  return {
    error: {
      code: error?.code ?? "CI_RESOURCE_STUDIO_REQUEST_FAILED",
      message:
        error instanceof Error
          ? error.message
          : "Resource Studio request failed.",
      ...(Array.isArray(error?.conflicts) && error.conflicts.length > 0
        ? { conflicts: error.conflicts }
        : {}),
    },
  };
}

function ciAssertActionResult(result) {
  if (result?.status !== "conflicted") return result;
  const error = new Error(
    "Resource Studio detected concurrent file changes and did not complete the action.",
  );
  error.code = "CI_RESOURCE_STUDIO_TRANSACTION_CONFLICT";
  error.statusCode = 409;
  error.conflicts = result.conflicts ?? [];
  throw error;
}

function ciParseCookies(header) {
  return Object.fromEntries(
    String(header ?? "")
      .split(";")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const separator = entry.indexOf("=");
        return separator < 0
          ? [entry, ""]
          : [entry.slice(0, separator), entry.slice(separator + 1)];
      }),
  );
}

function ciIsLoopback(address) {
  return ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(address);
}

async function ciReadJsonBody(request) {
  if (
    !String(request.headers["content-type"] ?? "").startsWith(
      "application/json",
    )
  ) {
    const error = new Error("Requests with a body must use application/json.");
    error.statusCode = 415;
    throw error;
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > CI_MAX_BODY_BYTES) {
      const error = new Error("Resource Studio request body is too large.");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  if (size === 0) return {};
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("Body must be an object.");
    }
    return value;
  } catch (error) {
    const invalid = new Error("Resource Studio request body is invalid JSON.", {
      cause: error,
    });
    invalid.statusCode = 400;
    throw invalid;
  }
}

function ciCreateSerialQueue() {
  let tail = Promise.resolve();
  return (work) => {
    const result = tail.then(work, work);
    tail = result.catch(() => undefined);
    return result;
  };
}

export async function ciStartResourceStudioServer({
  service,
  awsRuntime,
  localStore,
  port = 0,
  bootstrapToken = ciRandomToken(),
  bootstrapTtlMs = CI_BOOTSTRAP_TTL_MS,
  sessionTtlMs = CI_SESSION_TTL_MS,
  now = Date.now,
  onShutdown,
}) {
  if (!Number.isInteger(port) || port < 0 || port > 65_535) {
    throw new Error(
      "Resource Studio port must be an integer from 0 through 65535.",
    );
  }
  if (!Number.isFinite(bootstrapTtlMs) || bootstrapTtlMs <= 0) {
    throw new Error("Resource Studio bootstrap TTL must be positive.");
  }
  if (!Number.isFinite(sessionTtlMs) || sessionTtlMs <= 0) {
    throw new Error("Resource Studio session TTL must be positive.");
  }
  const sessions = new Map();
  const serialize = ciCreateSerialQueue();
  let expectedOrigin;
  let expectedHost;
  let bootstrapAvailable = true;
  const bootstrapExpiresAt = now() + bootstrapTtlMs;

  const requireSession = (request) => {
    const cookies = ciParseCookies(request.headers.cookie);
    const sessionId = cookies[CI_SESSION_COOKIE];
    const session = sessions.get(sessionId);
    const currentTime = now();
    if (session && session.expiresAt <= currentTime) {
      sessions.delete(sessionId);
    }
    if (!session || session.expiresAt <= currentTime) {
      const error = new Error("Resource Studio session is not authenticated.");
      error.statusCode = 401;
      error.code = "CI_RESOURCE_STUDIO_UNAUTHENTICATED";
      throw error;
    }
    return session;
  };

  const requireSameOrigin = (request, session) => {
    if (request.headers.origin !== expectedOrigin) {
      const error = new Error(
        "Resource Studio rejected a cross-origin request.",
      );
      error.statusCode = 403;
      error.code = "CI_RESOURCE_STUDIO_ORIGIN_REJECTED";
      throw error;
    }
    if (session && request.headers["x-ci-csrf"] !== session.csrf) {
      const error = new Error(
        "Resource Studio rejected a request without its CSRF proof.",
      );
      error.statusCode = 403;
      error.code = "CI_RESOURCE_STUDIO_CSRF_REJECTED";
      throw error;
    }
  };

  const server = http.createServer(async (request, response) => {
    try {
      if (!ciIsLoopback(request.socket.remoteAddress)) {
        ciJson(
          response,
          403,
          ciErrorPayload(new Error("Loopback access only.")),
        );
        return;
      }
      if (request.headers.host !== expectedHost) {
        ciJson(
          response,
          421,
          ciErrorPayload(new Error("Unexpected Resource Studio host.")),
        );
        return;
      }
      const requestUrl = new URL(request.url ?? "/", expectedOrigin);
      const pathname = requestUrl.pathname;

      const staticAssets = new Map([
        ["/", ["index.html", "text/html; charset=utf-8"]],
        ["/studio.css", ["studio.css", "text/css; charset=utf-8"]],
        ["/studio.js", ["studio.js", "text/javascript; charset=utf-8"]],
      ]);
      if (
        (request.method === "GET" || request.method === "HEAD") &&
        staticAssets.has(pathname)
      ) {
        const [fileName, contentType] = staticAssets.get(pathname);
        const bytes = await readFile(path.join(CI_ASSET_ROOT, fileName));
        response.writeHead(200, ciSecurityHeaders(contentType));
        response.end(request.method === "HEAD" ? undefined : bytes);
        return;
      }

      if (request.method === "POST" && pathname === "/api/session") {
        requireSameOrigin(request);
        const authorization = String(request.headers.authorization ?? "");
        if (
          !bootstrapAvailable ||
          bootstrapExpiresAt <= now() ||
          authorization !== `Bearer ${bootstrapToken}`
        ) {
          const error = new Error(
            "The Resource Studio bootstrap token is invalid or expired.",
          );
          error.statusCode = 401;
          error.code = "CI_RESOURCE_STUDIO_INVALID_BOOTSTRAP_TOKEN";
          throw error;
        }
        bootstrapAvailable = false;
        const sessionId = ciRandomToken();
        const csrf = ciRandomToken();
        const createdAt = now();
        sessions.set(sessionId, {
          csrf,
          createdAt,
          expiresAt: createdAt + sessionTtlMs,
        });
        ciJson(
          response,
          200,
          { authenticated: true, csrf },
          {
            "Set-Cookie": `${CI_SESSION_COOKIE}=${sessionId}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${Math.max(1, Math.floor(sessionTtlMs / 1_000))}`,
          },
        );
        return;
      }

      if (!pathname.startsWith("/api/")) {
        ciJson(
          response,
          404,
          ciErrorPayload(new Error("Resource Studio route not found.")),
        );
        return;
      }

      const session = requireSession(request);
      const isMutation = !["GET", "HEAD"].includes(request.method ?? "");
      if (isMutation) requireSameOrigin(request, session);

      if (request.method === "GET" && pathname === "/api/state") {
        const value = await serialize(async () => ({
          ...(await service.getState()),
          settings: await awsRuntime.getSettings(),
        }));
        ciJson(response, 200, value);
        return;
      }

      if (request.method === "GET" && pathname === "/api/logs") {
        ciJson(response, 200, { logs: await localStore.readLogs() });
        return;
      }

      if (request.method === "POST" && pathname === "/api/entities") {
        const body = await ciReadJsonBody(request);
        const result = ciAssertActionResult(
          await serialize(() => service.createEntity(body)),
        );
        await localStore.appendLog?.({
          type: "data-entity",
          status: "completed",
          operation: "create",
          entityId: body.id,
          transactionId: result.transactionId,
          message: `Created Data Entity ${body.id}.`,
        });
        ciJson(response, 201, result);
        return;
      }

      const entityMatch = pathname.match(
        /^\/api\/entities\/([a-z][a-z0-9]*(?:-[a-z0-9]+)*)$/,
      );
      if (entityMatch && request.method === "PUT") {
        const body = await ciReadJsonBody(request);
        const result = ciAssertActionResult(
          await serialize(() => service.updateEntity(entityMatch[1], body)),
        );
        await localStore.appendLog?.({
          type: "data-entity",
          status: "completed",
          operation: "update",
          entityId: entityMatch[1],
          transactionId: result.transactionId,
          message: `Updated Data Entity ${entityMatch[1]}.`,
        });
        ciJson(response, 200, result);
        return;
      }
      if (entityMatch && request.method === "DELETE") {
        const result = ciAssertActionResult(
          await serialize(() => service.dropEntity(entityMatch[1])),
        );
        await localStore.appendLog?.({
          type: "data-entity",
          status: "completed",
          operation: "drop",
          entityId: entityMatch[1],
          transactionId: result.transactionId,
          message: `Dropped Data Entity ${entityMatch[1]}; source rollback remains available until files drift.`,
        });
        ciJson(response, 200, result);
        return;
      }

      if (request.method === "POST" && pathname === "/api/undo") {
        const body = await ciReadJsonBody(request);
        const result = ciAssertActionResult(
          await serialize(() => service.undo(body.transactionId)),
        );
        await localStore.appendLog?.({
          type: "data-entity",
          status: "completed",
          operation: "undo",
          transactionId: result.transactionId,
          message: `Rolled back Resource Studio transaction ${result.transactionId}.`,
        });
        ciJson(response, 200, result);
        return;
      }

      if (request.method === "POST" && pathname === "/api/aws/preflight") {
        const body = await ciReadJsonBody(request);
        ciJson(
          response,
          200,
          await serialize(async () =>
            awsRuntime.preflight({
              ...body,
              planHash: await service.getDeploymentPlanHash(),
            }),
          ),
        );
        return;
      }
      if (request.method === "POST" && pathname === "/api/aws/sso-login") {
        const body = await ciReadJsonBody(request);
        ciJson(
          response,
          200,
          await serialize(async () =>
            awsRuntime.ssoLogin({
              ...body,
              planHash: await service.getDeploymentPlanHash(),
            }),
          ),
        );
        return;
      }
      if (request.method === "POST" && pathname === "/api/sandbox/deploy") {
        const body = await ciReadJsonBody(request);
        ciJson(
          response,
          200,
          await serialize(async () =>
            awsRuntime.deploy({
              ...body,
              planHash: await service.getDeploymentPlanHash(),
            }),
          ),
        );
        return;
      }
      if (request.method === "POST" && pathname === "/api/shutdown") {
        ciJson(response, 200, { status: "shutting-down" });
        setImmediate(() => {
          server.close();
          onShutdown?.();
        });
        return;
      }

      ciJson(
        response,
        404,
        ciErrorPayload(new Error("Resource Studio API route not found.")),
      );
    } catch (error) {
      const statusCode = Number.isInteger(error?.statusCode)
        ? error.statusCode
        : 500;
      ciJson(response, statusCode, ciErrorPayload(error));
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Resource Studio could not determine its localhost port.");
  }
  expectedHost = `127.0.0.1:${address.port}`;
  expectedOrigin = `http://${expectedHost}`;

  return {
    origin: expectedOrigin,
    port: address.port,
    url: `${expectedOrigin}/#token=${encodeURIComponent(bootstrapToken)}`,
    close: async () => {
      sessions.clear();
      if (!server.listening) return;
      await new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    },
  };
}
