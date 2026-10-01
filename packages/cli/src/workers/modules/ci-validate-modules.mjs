import { ciValidateModules } from "../../tooling/ci-validate-modules.mjs";

const rootIndex = process.argv.indexOf("--root");
await ciValidateModules({
  workspaceRoot: process.env.CLOUDIGNITER_WORKSPACE_ROOT ?? process.cwd(),
  kind: "user",
  ...(rootIndex >= 0 ? { root: process.argv[rootIndex + 1] } : {}),
});
