export default {
  packageName: "@cloudigniter/next",

  // for template
  sourceAlias: {
    alias: "@ci-next/*",
    appPath: "../../../packages/next/src/*",
  },

  appTemplate: {
    folderName: "cloudigniter-next-aws-v1",
    tsconfigPath: "../../apps/templates/cloudigniter-next-aws-v1/tsconfig.json",
    globalsCssPath: "../../apps/templates/cloudigniter-next-aws-v1/src/app/globals.css",
  },

  // for the package tsconfig.json path when source of these packages -is src
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
    // locales: {
    //   src: "./src/locales/index.ts",
    //   dist: "./dist/locales/index.js",
    // },
  },

  css: {
    srcPrefix: "./src/styles/",
    distPrefix: "./dist/styles/",
  },
};
