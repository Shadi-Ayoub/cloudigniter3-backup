export default {
  packageName: "@cloudigniter/core",

  sourceAlias: {
    alias: "@ci-core/*",
    appPath: "../../../packages/core/src/*",
  },

  appTemplate: {
    folderName: "cloudigniter-next-aws-v1",
    tsconfigPath: "../../apps/templates/cloudigniter-next-aws-v1/tsconfig.json",
    globalsCssPath: "../../apps/templates/cloudigniter-next-aws-v1/src/app/globals.css",
  },

  currentPackageAliases: [],

  specialExports: {
    types: {
      src: "./src/types/index.ts",
      dist: "./dist/types/index.d.ts",
    },
  },
};
