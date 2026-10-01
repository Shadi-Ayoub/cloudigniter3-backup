import { ciValidateModules } from "@cloudigniter/cli/tooling/modules";

const option = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
};
await ciValidateModules({
  workspaceRoot: process.env.CLOUDIGNITER_WORKSPACE_ROOT ?? process.cwd(),
  kind: option("--kind", "core"),
  root: option("--root", undefined),
});
