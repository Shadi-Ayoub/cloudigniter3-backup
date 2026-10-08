export default {
  packageName: "@cloudigniter/aws",

  sourceAlias: {
    alias: "@ci-aws/*",
    appPath: "../../../packages/aws/src/*",
  },

  appTemplate: {
    folderName: "cloudigniter-next-aws-v1",
    tsconfigPath: "../../apps/templates/cloudigniter-next-aws-v1/tsconfig.json",
    globalsCssPath: "../../apps/templates/cloudigniter-next-aws-v1/src/app/globals.css",
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
