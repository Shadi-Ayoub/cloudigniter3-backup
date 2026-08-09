/** Defines source/distribution switching for the UI package and template aliases. */
export default {
  packageName: "@cloudigniter/ui",

  sourceAlias: {
    alias: "@ci-ui/*",
    appPath: "../../packages/ui/src/*",
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
