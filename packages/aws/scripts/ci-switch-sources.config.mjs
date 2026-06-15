export default {
  packageName: "@cloudigniter/aws",

  sourceAlias: {
    alias: "@ci-aws/*",
    appPath: "../../packages/aws/src/*",
  },

  appTemplate: {
    folderName: "template",
    tsconfigPath: "../../apps/template/tsconfig.json",
    globalsCssPath: "../../apps/template/src/app/globals.css",
  },

  currentPackageAliases: [
    {
      alias: "@ci-core/*",
      path: "../core/src/*",
    },
  ],

  specialExports: {
    types: {
      src: "./src/types/index.ts",
      dist: "./dist/types/index.d.ts",
    },
  },
};
