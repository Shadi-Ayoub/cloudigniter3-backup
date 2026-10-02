import path from "node:path";
import { fileURLToPath } from "node:url";

/** @type {Promise<Map<string,{content:Uint8Array,type:string}>> | undefined} */
let pending;

/** Bundle the installed editor in memory on first use. No CDN or workspace files are served. */
export function ciPublisherEditorAssets() {
  if (!pending)
    pending = buildEditor().catch((error) => {
      pending = undefined;
      throw error;
    });
  return pending;
}

async function buildEditor() {
  const { build } = await import("esbuild");
  const directory = fileURLToPath(new URL("./publisher/", import.meta.url));
  const outdir = path.join(directory, ".editor-bundle");
  const result = await build({
    entryPoints: {
      editor: path.join(directory, "editor-entry.js"),
      "editor.worker": fileURLToPath(
        import.meta.resolve("monaco-editor/esm/vs/editor/editor.worker.js"),
      ),
    },
    outdir,
    bundle: true,
    splitting: true,
    format: "esm",
    platform: "browser",
    target: "es2022",
    write: false,
    minify: true,
    loader: { ".ttf": "file" },
    assetNames: "[name]-[hash]",
    legalComments: "eof",
    logLevel: "silent",
  });
  const types = /** @type {Record<string,string>} */ ({
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".ttf": "font/ttf",
  });
  return new Map(
    result.outputFiles.map((file) => [
      `/editor/${path.relative(outdir, file.path).split(path.sep).join("/")}`,
      {
        content: file.contents,
        type: types[path.extname(file.path)] ?? "application/octet-stream",
      },
    ]),
  );
}
