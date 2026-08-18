import { access, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

async function ciPathExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function ciResolveExportTarget(entry) {
  if (typeof entry === "string") return entry;
  if (!entry || typeof entry !== "object") return undefined;

  return entry.import ?? entry.default ?? entry.node ?? entry.types;
}

function ciCloudIgniterWorkspacePackagePath(baseDirectory, packageName) {
  if (!packageName.startsWith("@cloudigniter/")) return undefined;

  return path.join(
    baseDirectory,
    "packages",
    packageName.slice("@cloudigniter/".length),
    "package.json",
  );
}

export async function ciImportPackageEntry({
  baseDirectory,
  packageName,
  subpath = ".",
}) {
  const packageJsonCandidates = [
    path.join(baseDirectory, "node_modules", ...packageName.split("/"), "package.json"),
    ciCloudIgniterWorkspacePackagePath(baseDirectory, packageName),
  ].filter(Boolean);

  const packageJsonPath = await packageJsonCandidates.reduce(
    async (resolvedPromise, candidate) => {
      const resolved = await resolvedPromise;
      if (resolved) return resolved;
      return (await ciPathExists(candidate)) ? candidate : undefined;
    },
    Promise.resolve(undefined),
  );

  if (!packageJsonPath) {
    throw new Error(
      `Cannot resolve ${packageName} from ${baseDirectory}. Install it in the target project.`,
    );
  }

  const packageDirectory = await realpath(path.dirname(packageJsonPath));
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
  const exportKey = subpath === "." ? "." : `./${subpath.replace(/^\.\//, "")}`;
  const exportTarget = ciResolveExportTarget(packageJson.exports?.[exportKey]);

  if (!exportTarget) {
    throw new Error(`${packageName} does not export ${exportKey}.`);
  }

  return import(pathToFileURL(path.resolve(packageDirectory, exportTarget)).href);
}
