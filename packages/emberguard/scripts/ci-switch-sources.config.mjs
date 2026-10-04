export default {
  packageName: "@cloudigniter/emberguard",

  sourceAlias: {
    alias: "@ci-emberguard/*",
    appPath: "../../packages/emberguard/src/*",
  },

  appTemplate: {
    folderName: "template",
    tsconfigPath: "../../apps/template/tsconfig.json",
    globalsCssPath: "../../apps/template/src/app/globals.css",
  },

  currentPackageAliases: [],

  specialExports: {
    types: {
      src: "./src/types/index.ts",
      dist: "./dist/types/index.d.ts",
    },
  },
};
