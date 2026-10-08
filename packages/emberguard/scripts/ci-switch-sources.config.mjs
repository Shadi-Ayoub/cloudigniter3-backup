export default {
  packageName: "@cloudigniter/emberguard",

  sourceAlias: {
    alias: "@ci-emberguard/*",
    appPath: "../../../packages/emberguard/src/*",
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
