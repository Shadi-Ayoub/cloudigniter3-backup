import {
  lstat,
  mkdir,
  readdir,
  readFile,
  writeFile,
  rename,
  rm,
} from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { checkSite, siteRoot } from "./check.mjs";

await checkSite();
const output = path.join(siteRoot, "dist");
try {
  const stat = await lstat(output);
  if (!stat.isDirectory() || stat.isSymbolicLink())
    throw new Error("dist must be a regular directory, never a symlink.");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  await mkdir(output);
}
for (const name of await readdir(output)) {
  if (name !== "index.html")
    throw new Error(
      `Unexpected dist entry: ${name}. Move it aside and retry; nothing was deleted.`,
    );
  const stat = await lstat(path.join(output, name));
  if (!stat.isFile() || stat.isSymbolicLink())
    throw new Error("dist/index.html must be a regular file, never a symlink.");
}
const temporary = path.join(output, `.index-${randomUUID()}.tmp`);
try {
  await writeFile(
    temporary,
    await readFile(path.join(siteRoot, "index.html")),
    { flag: "wx" },
  );
  await rename(temporary, path.join(output, "index.html"));
} finally {
  await rm(temporary, { force: true });
}
console.log(
  `Public release staged at ${output}/index.html. Upload only the contents of dist/.`,
);
