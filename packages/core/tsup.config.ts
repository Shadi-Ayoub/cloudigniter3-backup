import { defineConfig } from "tsup";

import { ciCreateTsupConfig } from "../../scripts/build-steps/ci-tsup-config";

const externalPackages = ["react", "react-dom"];

export default defineConfig(async () =>
  ciCreateTsupConfig({
    mode: "core",
    external: externalPackages,
    clientDirectiveTargets: ["dist/client"],
  }),
);

// import { defineConfig } from "tsup";
// import { preserveDirectivesPlugin } from "esbuild-plugin-preserve-directives";
// import { getAllEntries } from "../../scripts/build-steps/ci-entries.mjs";
// import { ciInjectUseClient } from "../../scripts/build-steps/ci-inject-use-client.mjs";

// const isProduction = process.env.NODE_ENV === "production";

// const externalPackages = ["react", "react-dom"];

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
//       // metafile: true, // Helps the plugin accurately map files to chunks
//       // esbuildPlugins: [
//       //   preserveDirectivesPlugin({
//       //     directives: ["use client", "use server"],
//       //     include: /\.(js|ts|jsx|tsx)$/,
//       //     exclude: /node_modules/,
//       //   }),
//       // ],
//       esbuildOptions(opts) {
//         // opts.treeShaking = true;
//         // opts.plugins = [];
//         // opts.chunkNames = "chunks/[name]-[hash]";
//         opts.jsx = "automatic";
//         // opts.banner = {
//         //   js: '"use client";',
//         // };
//       },
//       silent: true,
//       onSuccess: async () => {
//         console.log("✅ Client Entries Build completed");
//         await ciInjectUseClient(["dist/client"]);
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
//       // metafile: true, // Helps the plugin accurately map files to chunks
//       // esbuildPlugins: [
//       //   preserveDirectivesPlugin({
//       //     directives: ["use client", "use server"],
//       //     include: /\.(js|ts|jsx|tsx)$/,
//       //     exclude: /node_modules/,
//       //   }),
//       // ],
//       silent: true,
//       esbuildOptions(opts) {
//         // opts.treeShaking = true;
//         // opts.plugins = [];
//         // opts.chunkNames = "chunks/[name]-[hash]";
//         opts.jsx = "automatic";
//       },
//       onSuccess: async () => {
//         console.log("✅ Other Entries Build completed");
//       },
//     },
//   ];
// });
