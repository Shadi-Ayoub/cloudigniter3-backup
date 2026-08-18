import { defineConfig } from "tsup";

import { ciCreateTsupConfig } from "@cloudigniter/cli/tooling/tsup";

const externalPackages = [
  "react",
  "react-dom",
  "motion",
  "motion/react",
  "@monaco-editor/react",
  "@aws-amplify/ui-react",
  "aws-amplify",
];

export default defineConfig(async () =>
  ciCreateTsupConfig({
    mode: "aws",
    external: externalPackages,
    clientDirectiveTargets: ["dist/client/index.js"],
  }),
);

// import { defineConfig } from "tsup";
// import type { BuildOptions } from "esbuild";
// import { getAllEntries } from "@cloudigniter/cli/tooling/entries";

// const isProduction = process.env.NODE_ENV === "production";

// const externalPackages = [
//   "react",
//   "react-dom",
//   "motion",
//   "motion/react",
//   "@monaco-editor/react",
//   "@aws-amplify/ui-react",
//   "aws-amplify",
// ];

// function ciSetEsbuildOptions(opts: BuildOptions) {
//   opts.jsx = "automatic";
// }

// export default defineConfig(async () => {
//   const { clientEntries, otherEntries } = await getAllEntries();

//   return [
//     // Client entrypoints
//     {
//       entry: clientEntries,
//       format: ["esm"],
//       bundle: true,
//       splitting: false,
//       sourcemap: !isProduction,
//       clean: true,
//       minify: isProduction,
//       treeshake: true,
//       target: "es2022",
//       dts: false,
//       outDir: "dist",
//       tsconfig: "./tsconfig.build.json",
//       external: externalPackages,
//       esbuildOptions: ciSetEsbuildOptions,
//       silent: true,
//       onSuccess: async () => {
//         console.log("✅ Client Entries Build completed");
//         await ciInjectUseClient(["dist/client/index.js"]);
//       },
//     },

//     /**
//      * Other entries:
//      * - Server, proxy, lib, locale, and utility modules.
//      * - Bundled to avoid unresolved internal relative imports.
//      * - Must remain free from client-only modules.
//      */
//     {
//       entry: otherEntries,
//       format: ["esm"],
//       bundle: true,
//       splitting: false,
//       sourcemap: !isProduction,
//       clean: false,
//       minify: isProduction,
//       treeshake: true,
//       target: "es2022",
//       dts: false,
//       outDir: "dist",
//       tsconfig: "./tsconfig.build.json",
//       external: externalPackages,
//       silent: true,
//       esbuildOptions(opts) {
//         opts.jsx = "automatic";
//       },
//       onSuccess: async () => {
//         console.log("✅ Other Entries Build completed");
//       },
//     },
//   ];
// });
