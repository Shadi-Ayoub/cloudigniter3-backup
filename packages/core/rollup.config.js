import dts from "rollup-plugin-dts";

/** @type {import('rollup').RollupOptions} */
const config = [
  {
    input: "dist/.types/index.d.ts",
    output: {
      file: "dist/index.d.ts",
      format: "es",
    },
    plugins: [dts()],
  },
  {
    input: "dist/.types/client/index.d.ts",
    output: {
      file: "dist/client/index.d.ts",
      format: "es",
    },
    plugins: [dts()],
  },
  {
    input: "dist/.types/server/index.d.ts",
    output: {
      file: "dist/server/index.d.ts",
      format: "es",
    },
    plugins: [dts()],
  },
  {
    input: "dist/.types/lib/index.d.ts",
    output: {
      file: "dist/lib/index.d.ts",
      format: "es",
    },
    plugins: [dts()],
  },
  {
    input: "dist/.types/types/index.d.ts",
    output: {
      file: "dist/types/index.d.ts",
      format: "es",
    },
    plugins: [dts()],
  },
];

export default config;
