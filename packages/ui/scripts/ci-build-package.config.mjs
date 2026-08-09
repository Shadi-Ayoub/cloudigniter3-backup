/** Defines the shared development and production build pipelines for the UI package. */
const ciBuildPackageConfig = {
  steps: {
    dev: [
      {
        file: "ci-clean.mjs",
        message: "Cleaning previous build artifacts",
      },
      {
        file: "ci-switch-src.mjs",
        message: "Switching package exports to source mode",
      },
      {
        file: "ci-build-js.mjs",
        message: "Building JavaScript bundles",
      },
      {
        file: "ci-build-types-raw.mjs",
        message: "Generating raw TypeScript declarations",
      },
      {
        file: "ci-build-types.mjs",
        message: "Bundling declaration files",
      },
    ],

    prod: [
      {
        file: "ci-clean.mjs",
        message: "Cleaning previous build artifacts",
      },
      {
        file: "ci-switch-src.mjs",
        message: "Switching package exports to source mode",
      },
      {
        file: "ci-build-js.mjs",
        message: "Building JavaScript bundles",
      },
      {
        file: "ci-build-types-raw.mjs",
        message: "Generating raw TypeScript declarations",
      },
      {
        file: "ci-build-types.mjs",
        message: "Bundling declaration files",
      },
      {
        file: "ci-clean-types-temp.mjs",
        message: "Removing temporary declaration artifacts",
      },
      {
        file: "ci-clean-maps.mjs",
        message: "Removing source maps",
      },
      {
        file: "ci-obfuscate-package.mjs",
        message: "Obfuscating production code",
      },
      {
        file: "ci-switch-dist.mjs",
        message: "Switching package exports to distribution mode",
      },
    ],
  },
};

export default ciBuildPackageConfig;
