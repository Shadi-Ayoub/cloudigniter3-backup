import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { ciPublisherPath } from "./publisher-workspace.mjs";

const types = {
  html: "text/html; charset=utf-8",
  css: "text/css; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  ico: "image/x-icon",
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  mp4: "video/mp4",
  webm: "video/webm",
};

/** Preview only public files. Never serve the project tree, policies or scripts.
 * @param {string} root @param {string} host @param {number} port
 */
export async function ciStartWorkspaceStatic(root, host, port) {
  const server = createServer(async (request, response) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405);
      response.end();
      return;
    }
    try {
      const pathname = decodeURIComponent(
        new URL(request.url ?? "/", "http://localhost").pathname,
      );
      const relative = pathname === "/" ? "index.html" : pathname.slice(1);
      const extension = relative.split(".").at(-1) ?? "";
      const contentType = Object.hasOwn(types, extension)
        ? types[/** @type {keyof typeof types} */ (extension)]
        : undefined;
      if (
        !contentType ||
        relative.split("/").some((part) => part.startsWith(".")) ||
        (relative.includes("/") && !/^(?:assets|public)\//.test(relative))
      ) {
        response.writeHead(404);
        response.end();
        return;
      }
      const content = await readFile(await ciPublisherPath(root, relative));
      response.writeHead(200, {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      });
      response.end(request.method === "HEAD" ? undefined : content);
    } catch {
      response.writeHead(404);
      response.end();
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => resolve(undefined));
  });
  return server;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const server = await ciStartWorkspaceStatic(
    process.argv[2],
    process.argv[3],
    Number(process.argv[4]),
  );
  console.log("Static workspace website ready.");
  const stop = () => {
    server.close();
    server.closeAllConnections();
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
}
