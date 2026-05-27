export default {
  packageName: "@cloudigniter/next",

  sourceAlias: {
    alias: "@ci-next/*",
    appPath: "../../packages/next/src/*",
  },

  appTemplate: {
    folderName: "template",
    tsconfigPath: "../../apps/template/tsconfig.json",
  },

  currentPackageAliases: [
    {
      alias: "@ci-core/*",
      path: "../core/src/*",
    },
    {
      alias: "@ci-aws/*",
      path: "../aws/src/*",
    },
  ],

  specialExports: {
    types: {
      src: "./src/types/index.ts",
      dist: "./dist/types/index.d.ts",
    },
    locales: {
      src: "./src/locales/index.ts",
      dist: "./dist/locales/index.d.ts",
    },
  },

  css: {
    srcPrefix: "./src/styles/",
    distPrefix: "./dist/styles/",
  },
};
