import { spawn } from "node:child_process";
import { access, readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { ciImportPackageEntry } from "../../runtime/ci-import-package-entry.mjs";

const ciWorkspaceRoot = resolve(
  process.env.CLOUDIGNITER_WORKSPACE_ROOT ?? process.cwd(),
);
const ciWorkspaceModuleEntry = resolve(
  ciWorkspaceRoot,
  "packages/core/src/lib/module/index.ts",
);
const ciModuleHelpers = await access(ciWorkspaceModuleEntry)
  .then(() => import(pathToFileURL(ciWorkspaceModuleEntry).href))
  .catch(() =>
    ciImportPackageEntry({
      baseDirectory: ciWorkspaceRoot,
      packageName: "@cloudigniter/core",
      subpath: "lib",
    }),
  );
const { ciCollectModulePackageDependencies } = ciModuleHelpers;
const ciNextPackageDirectory = resolve(ciWorkspaceRoot, "packages/next");
const ciModulesDirectory = resolve(ciNextPackageDirectory, "src/modules");
const ciNextPackageJsonPath = resolve(ciNextPackageDirectory, "package.json");

const ciCheckOnly = process.argv.includes("--check");

async function ciLoadModuleManifests() {
  const entries = await readdir(ciModulesDirectory, {
    withFileTypes: true,
  });

  const moduleDirectories = entries
    .filter((entry) => entry.isDirectory())
    .sort((left, right) => left.name.localeCompare(right.name));

  const manifests = [];

  for (const moduleDirectory of moduleDirectories) {
    const manifestPath = resolve(
      ciModulesDirectory,
      moduleDirectory.name,
      "manifest.ts",
    );

    const manifestUrl = pathToFileURL(manifestPath).href;
    const importedManifest = await import(manifestUrl);
    const manifest = importedManifest.ciModuleManifest;

    if (!manifest) {
      throw new Error(
        `Module "${moduleDirectory.name}" must export ` +
          `"ciModuleManifest" from manifest.ts.`,
      );
    }

    manifests.push(manifest);
  }

  return manifests;
}

function ciSortPackageSection(section) {
  return Object.fromEntries(
    Object.entries(section).sort(([left], [right]) =>
      left.localeCompare(right),
    ),
  );
}

async function ciRunPnpmInstall(packageName) {
  const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

  await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, ["install", "--filter", packageName], {
      cwd: ciWorkspaceRoot,
      stdio: "inherit",
      shell: false,
    });

    child.on("error", rejectPromise);

    child.on("exit", (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      rejectPromise(new Error(`pnpm install exited with code ${code}.`));
    });
  });
}

async function ciInstallModuleDependencies() {
  const manifests = await ciLoadModuleManifests();
  const dependencies = ciCollectModulePackageDependencies(manifests);

  const packageJsonSource = await readFile(ciNextPackageJsonPath, "utf8");

  const packageJson = JSON.parse(packageJsonSource);
  let changed = false;

  for (const dependency of dependencies) {
    for (const section of dependency.sections) {
      packageJson[section] ??= {};

      if (packageJson[section][dependency.name] === dependency.specifier) {
        continue;
      }

      const previous = packageJson[section][dependency.name] ?? "(missing)";

      console.log(
        `${section}: ${dependency.name} ` +
          `${previous} → ${dependency.specifier}`,
      );

      packageJson[section][dependency.name] = dependency.specifier;

      changed = true;
    }
  }

  for (const section of [
    "dependencies",
    "devDependencies",
    "peerDependencies",
    "optionalDependencies",
  ]) {
    if (packageJson[section]) {
      packageJson[section] = ciSortPackageSection(packageJson[section]);
    }
  }

  if (ciCheckOnly) {
    if (changed) {
      throw new Error("Module package dependencies are not synchronized.");
    }

    console.log("✅ Module package dependencies are synchronized.");

    return;
  }

  if (changed) {
    await writeFile(
      ciNextPackageJsonPath,
      `${JSON.stringify(packageJson, null, 2)}\n`,
      "utf8",
    );

    console.log("✅ Updated packages/next/package.json.");
  } else {
    console.log("✅ No package.json changes were required.");
  }

  await ciRunPnpmInstall(packageJson.name);
}

await ciInstallModuleDependencies();
