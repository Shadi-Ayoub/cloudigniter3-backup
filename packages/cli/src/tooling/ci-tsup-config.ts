import type { Options } from "tsup";
import type { BuildOptions } from "esbuild";
import { getAllEntries } from "./ci-entries.mjs";
import { ciInjectUseClient } from "./ci-inject-use-client.mjs";
/**
 * Supported CloudIgniter package build modes.
 */
export type CiTsupPackageMode = "core" | "aws" | "next" | "ui";

/**
 * Common tsup config input.
 */
export type CiCreateTsupConfigInput = {
  //Package-specific external dependencies.
  external: string[];

  // Package build mode.
  mode: CiTsupPackageMode;

  // Output paths or files that should receive "use client".
  clientDirectiveTargets: string[];
};

/**
 * Returns whether the current build runs in production mode.
 */
function ciIsProductionBuild() {
  return process.env.NODE_ENV === "production";
}

/**
 * Applies shared esbuild options.
 */
function ciSetEsbuildOptions(opts: BuildOptions) {
  opts.jsx = "automatic";
}

/**
 * Creates the common base tsup options used by all package entry groups.
 */
function ciCreateBaseTsupOptions(input: {
  external: string[];
  clean: boolean;
  bundle: boolean;
  minify: boolean;
  withCssLoader?: boolean;
}): Options {
  const { external, clean, bundle, minify, withCssLoader = false } = input;
  const isProduction = ciIsProductionBuild();
  return {
    format: ["esm"],
    bundle,
    splitting: false,
    sourcemap: !isProduction,
    clean,
    minify,
    treeshake: true,
    target: "es2022",
    dts: false,
    outDir: "dist",
    tsconfig: "./tsconfig.build.json",
    external,
    silent: true,
    esbuildOptions: ciSetEsbuildOptions,
    ...(withCssLoader ? { loader: { ".css": "file" } } : {}),
  };
}

/**
 * Creates the shared tsup config array for CloudIgniter packages.
 */
export async function ciCreateTsupConfig(input: CiCreateTsupConfigInput) {
  const { external, mode, clientDirectiveTargets } = input;
  const isProduction = ciIsProductionBuild();
  const withCssLoader = mode === "next";
  const { clientEntries, rscEntries, otherEntries } = await getAllEntries();
  const configs: Options[] = [
    {
      ...ciCreateBaseTsupOptions({
        external,
        clean: true,
        bundle: true,
        minify: isProduction,
        withCssLoader,
      }),
      entry: clientEntries,
      onSuccess: async () => {
        console.log("✅ Client Entries Build completed");
        await ciInjectUseClient(clientDirectiveTargets);
      },
    },
  ];
  if (mode === "next") {
    configs.push({
      ...ciCreateBaseTsupOptions({
        external,
        clean: false,
        bundle: false,
        minify: false,
        withCssLoader,
      }),
      entry: rscEntries,
      onSuccess: async () => {
        console.log("✅ RSC Entries Build completed");
      },
    });
  }
  configs.push({
    ...ciCreateBaseTsupOptions({
      external,
      clean: false,
      bundle: true,
      minify: isProduction,
      withCssLoader,
    }),
    entry: otherEntries,
    onSuccess: async () => {
      console.log("✅ Other Entries Build completed");
    },
  });
  return configs;
}
