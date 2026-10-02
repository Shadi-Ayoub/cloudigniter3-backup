import { fileURLToPath } from "node:url";

/** @type {Promise<{content:Uint8Array,type:string,inputs:string[]}> | undefined} */
let pending;

/** Bundle the shared UI confirmation locally, without Next.js or a CDN. */
export function ciPublisherFeedbackAsset() {
  if (!pending)
    pending = buildFeedback().catch((error) => {
      pending = undefined;
      throw error;
    });
  return pending;
}

async function buildFeedback() {
  const { build } = await import("esbuild");
  const result = await build({
    entryPoints: [
      fileURLToPath(new URL("./publisher/feedback-entry.jsx", import.meta.url)),
    ],
    bundle: true,
    format: "esm",
    platform: "browser",
    target: "es2022",
    jsx: "automatic",
    define: { "process.env.NODE_ENV": '"production"' },
    write: false,
    minify: true,
    metafile: true,
    legalComments: "eof",
    logLevel: "silent",
  });
  return {
    content: result.outputFiles[0].contents,
    type: "text/javascript; charset=utf-8",
    inputs: Object.entries(Object.values(result.metafile.outputs)[0].inputs)
      .filter(([, input]) => input.bytesInOutput > 0)
      .map(([file]) => file),
  };
}
