import { readdir, readFile, stat } from "node:fs/promises";
import {
  basename,
  dirname,
  extname,
  isAbsolute,
  relative,
  resolve,
} from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import ts from "typescript";

import { ciCollectModulePackageDependencies } from "../../packages/core/src/lib/module/ci-collect-module-package-dependencies.ts";
import { ciResolveModuleGraph } from "../../packages/core/src/lib/module/ci-resolve-module-graph.ts";

const ciScriptDirectory = dirname(fileURLToPath(import.meta.url));

const ciWorkspaceRoot = resolve(ciScriptDirectory, "../..");

const ciCoreModulesDirectory = resolve(
  ciWorkspaceRoot,
  "packages/next/src/modules",
);

/**
 * Reads a command-line option.
 *
 * Supports both "--option=value" and "--option value" formats.
 */
function ciReadOption(optionName, fallback) {
  const inlinePrefix = `${optionName}=`;

  const inlineOption = process.argv.find((argument) =>
    argument.startsWith(inlinePrefix),
  );

  if (inlineOption) {
    return inlineOption.slice(inlinePrefix.length);
  }

  const optionIndex = process.argv.indexOf(optionName);

  if (optionIndex >= 0 && process.argv[optionIndex + 1]) {
    return process.argv[optionIndex + 1];
  }

  return fallback;
}

const ciModuleKind = ciReadOption("--kind", "core");

if (ciModuleKind !== "core" && ciModuleKind !== "user") {
  throw new Error('The "--kind" option must be either "core" or "user".');
}

const ciDefaultModulesDirectory =
  ciModuleKind === "core"
    ? ciCoreModulesDirectory
    : resolve(ciWorkspaceRoot, "apps/template/src/modules");

const ciModulesDirectory = resolve(
  ciWorkspaceRoot,
  ciReadOption("--root", ciDefaultModulesDirectory),
);

const ciHostSourceDirectory = resolve(ciModulesDirectory, "..");

const ciAllowedModuleRootEntries = new Set([
  "manifest.ts",
  "client",
  "server",
  "lib",
  "types",
  "README.md",
]);

const ciRuntimeEnvironments = new Set(["client", "server"]);

const ciPackageSections = new Set([
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
]);

const ciErrors = [];

/**
 * Adds a validation error.
 */
function ciAddError(filePath, message) {
  const relativePath = relative(ciWorkspaceRoot, filePath);

  ciErrors.push({
    filePath: relativePath,
    message,
  });
}

/**
 * Returns whether a filesystem entry exists.
 */
async function ciPathExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return false;
    }

    throw error;
  }
}

/**
 * Returns whether a path is inside another directory.
 */
function ciIsPathInside(candidatePath, parentDirectory) {
  const relativePath = relative(parentDirectory, candidatePath);

  return (
    relativePath === "" ||
    (!relativePath.startsWith("..") && !isAbsolute(relativePath))
  );
}

/**
 * Loads a TypeScript source file for syntax inspection.
 */
async function ciLoadTypeScriptSource(filePath) {
  const source = await readFile(filePath, "utf8");

  const scriptKind =
    extname(filePath) === ".tsx" ? ts.ScriptKind.TSX : ts.ScriptKind.TS;

  return ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    scriptKind,
  );
}

/**
 * Returns whether a declaration has a specific modifier.
 */
function ciHasModifier(node, modifierKind) {
  return (
    node.modifiers?.some((modifier) => modifier.kind === modifierKind) ?? false
  );
}

/**
 * Returns whether an import declaration is type-only.
 */
function ciIsTypeOnlyImport(statement) {
  const importClause = statement.importClause;

  if (!importClause) {
    return false;
  }

  if (importClause.isTypeOnly) {
    return true;
  }

  const namedBindings = importClause.namedBindings;

  if (namedBindings && ts.isNamedImports(namedBindings)) {
    return namedBindings.elements.every((element) => element.isTypeOnly);
  }

  return false;
}

/**
 * Returns whether an expression uses satisfies CiModuleManifest.
 */
function ciUsesModuleManifestSatisfies(expression, sourceFile) {
  if (ts.isSatisfiesExpression(expression)) {
    return expression.type.getText(sourceFile) === "CiModuleManifest";
  }

  if (
    ts.isAsExpression(expression) ||
    ts.isTypeAssertionExpression(expression) ||
    ts.isParenthesizedExpression(expression)
  ) {
    return ciUsesModuleManifestSatisfies(expression.expression, sourceFile);
  }

  return false;
}

/**
 * Returns the underlying object expression.
 */
function ciUnwrapExpression(expression) {
  if (
    ts.isSatisfiesExpression(expression) ||
    ts.isAsExpression(expression) ||
    ts.isTypeAssertionExpression(expression) ||
    ts.isParenthesizedExpression(expression)
  ) {
    return ciUnwrapExpression(expression.expression);
  }

  return expression;
}

/**
 * Validates general Module source conventions.
 */
async function ciValidateSourceConventions(filePath) {
  const sourceFile = await ciLoadTypeScriptSource(filePath);

  function inspect(node) {
    if (
      ts.isImportDeclaration(node) &&
      node.importClause?.namedBindings &&
      ts.isNamespaceImport(node.importClause.namedBindings)
    ) {
      ciAddError(
        filePath,
        "Namespace imports are not allowed. Use explicit named imports.",
      );
    }

    if (ts.isExportDeclaration(node)) {
      if (!node.exportClause || ts.isNamespaceExport(node.exportClause)) {
        ciAddError(
          filePath,
          "Wildcard exports are not allowed. Use explicit named exports.",
        );
      }
    }

    if (ts.isExportAssignment(node)) {
      ciAddError(
        filePath,
        "Default exports are not allowed. Use named exports.",
      );
    }

    if (
      (ts.isClassDeclaration(node) || ts.isFunctionDeclaration(node)) &&
      ciHasModifier(node, ts.SyntaxKind.DefaultKeyword)
    ) {
      ciAddError(
        filePath,
        "Default exports are not allowed. Use named exports.",
      );
    }

    ts.forEachChild(node, inspect);
  }

  inspect(sourceFile);
}

/**
 * Collects static and dynamic module specifiers.
 */
function ciCollectModuleSpecifiers(sourceFile) {
  const specifiers = [];

  function inspect(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    }

    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      specifiers.push(node.arguments[0].text);
    }

    ts.forEachChild(node, inspect);
  }

  inspect(sourceFile);

  return specifiers;
}

/**
 * Returns the runtime boundary referenced by a CloudIgniter package import.
 */
function ciGetCloudIgniterImportEnvironment(specifier) {
  const match = specifier.match(
    /^@(?:cloudigniter|ci-[^/]+)\/[^/]+\/(client|server)(?:\/|$)/,
  );

  if (match?.[1] === "client") {
    return "client";
  }

  if (match?.[1] === "server") {
    return "server";
  }

  const directMatch = specifier.match(
    /^@cloudigniter\/[^/]+\/(client|server)(?:\/|$)/,
  );

  if (directMatch?.[1] === "client") {
    return "client";
  }

  if (directMatch?.[1] === "server") {
    return "server";
  }

  return undefined;
}

/**
 * Returns whether a resolved path targets a Module runtime folder.
 */
function ciPathTargetsModuleEnvironment(candidatePath, environment) {
  const relativePath = relative(ciModulesDirectory, candidatePath);

  if (relativePath.startsWith("..") || isAbsolute(relativePath)) {
    return false;
  }

  const parts = relativePath.split(/[\\/]/);

  return parts[1] === environment;
}

/**
 * Validates imports between Module runtime boundaries.
 */
async function ciValidateImportBoundaries(
  moduleDirectory,
  filePath,
  sourceArea,
) {
  const sourceFile = await ciLoadTypeScriptSource(filePath);

  const specifiers = ciCollectModuleSpecifiers(sourceFile);

  for (const specifier of specifiers) {
    const packageEnvironment = ciGetCloudIgniterImportEnvironment(specifier);

    let referencedEnvironment = packageEnvironment;

    if (specifier.startsWith(".")) {
      const candidatePath = resolve(dirname(filePath), specifier);

      if (
        ciPathTargetsModuleEnvironment(candidatePath, "client") ||
        ciIsPathInside(candidatePath, resolve(moduleDirectory, "client"))
      ) {
        referencedEnvironment = "client";
      }

      if (
        ciPathTargetsModuleEnvironment(candidatePath, "server") ||
        ciIsPathInside(candidatePath, resolve(moduleDirectory, "server"))
      ) {
        referencedEnvironment = "server";
      }

      if (
        ciIsPathInside(candidatePath, resolve(ciHostSourceDirectory, "client"))
      ) {
        referencedEnvironment = "client";
      }

      if (
        ciIsPathInside(candidatePath, resolve(ciHostSourceDirectory, "server"))
      ) {
        referencedEnvironment = "server";
      }
    }

    if (sourceArea === "client" && referencedEnvironment === "server") {
      ciAddError(
        filePath,
        `Client code cannot import server code: "${specifier}".`,
      );
    }

    if (sourceArea === "server" && referencedEnvironment === "client") {
      ciAddError(
        filePath,
        `Server code cannot import client code: "${specifier}".`,
      );
    }

    if (
      (sourceArea === "lib" || sourceArea === "types") &&
      (referencedEnvironment === "client" || referencedEnvironment === "server")
    ) {
      ciAddError(
        filePath,
        `${sourceArea}/ code cannot import runtime-specific ` +
          `code: "${specifier}".`,
      );
    }
  }
}

/**
 * Recursively collects TypeScript source files.
 */
async function ciCollectTypeScriptFiles(directory) {
  if (!(await ciPathExists(directory))) {
    return [];
  }

  const entries = await readdir(directory, {
    withFileTypes: true,
  });

  const files = [];

  for (const entry of entries) {
    const entryPath = resolve(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await ciCollectTypeScriptFiles(entryPath)));

      continue;
    }

    if (
      entry.isFile() &&
      (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))
    ) {
      files.push(entryPath);
    }
  }

  return files.sort();
}

/**
 * Validates the manifest.ts source structure.
 */
async function ciValidateManifestSource(manifestPath) {
  const sourceFile = await ciLoadTypeScriptSource(manifestPath);

  const manifestDeclarations = [];

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) {
      if (!ciIsTypeOnlyImport(statement)) {
        ciAddError(
          manifestPath,
          "manifest.ts may contain only type-only imports.",
        );
      }

      if (
        ts.isStringLiteral(statement.moduleSpecifier) &&
        statement.moduleSpecifier.text !== "@cloudigniter/core/types"
      ) {
        ciAddError(
          manifestPath,
          "manifest.ts may import types only from " +
            '"@cloudigniter/core/types".',
        );
      }
    }

    if (
      ts.isVariableStatement(statement) &&
      ciHasModifier(statement, ts.SyntaxKind.ExportKeyword)
    ) {
      for (const declaration of statement.declarationList.declarations) {
        if (
          ts.isIdentifier(declaration.name) &&
          declaration.name.text === "ciModuleManifest"
        ) {
          manifestDeclarations.push(declaration);
        }
      }
    }

    if (ts.isExportAssignment(statement)) {
      ciAddError(
        manifestPath,
        "manifest.ts must use the named export " + '"ciModuleManifest".',
      );
    }
  }

  if (manifestDeclarations.length !== 1) {
    ciAddError(
      manifestPath,
      "manifest.ts must export exactly one " + '"ciModuleManifest" constant.',
    );

    return;
  }

  const declaration = manifestDeclarations[0];

  if (!declaration.initializer) {
    ciAddError(manifestPath, '"ciModuleManifest" must have an initializer.');

    return;
  }

  if (!ciUsesModuleManifestSatisfies(declaration.initializer, sourceFile)) {
    ciAddError(
      manifestPath,
      '"ciModuleManifest" must use ' + '"satisfies CiModuleManifest".',
    );
  }

  const unwrappedExpression = ciUnwrapExpression(declaration.initializer);

  if (!ts.isObjectLiteralExpression(unwrappedExpression)) {
    ciAddError(
      manifestPath,
      '"ciModuleManifest" must be declared as an object literal.',
    );
  }
}

/**
 * Validates the runtime value exported by manifest.ts.
 */
function ciValidateManifestValue(
  moduleName,
  moduleDirectory,
  manifest,
  moduleKind,
) {
  if (!manifest || typeof manifest !== "object") {
    ciAddError(
      resolve(moduleDirectory, "manifest.ts"),
      "ciModuleManifest must export an object.",
    );

    return;
  }

  if (manifest.schemaVersion !== 1) {
    ciAddError(
      resolve(moduleDirectory, "manifest.ts"),
      "schemaVersion must be 1.",
    );
  }

  if (moduleKind === "core") {
    const expectedModuleId = `cloudigniter.${moduleName}`;

    if (manifest.id !== expectedModuleId) {
      ciAddError(
        resolve(moduleDirectory, "manifest.ts"),
        `Core Module ID must be "${expectedModuleId}".`,
      );
    }
  } else {
    if (
      typeof manifest.id !== "string" ||
      !manifest.id.trim() ||
      /\s/.test(manifest.id)
    ) {
      ciAddError(
        resolve(moduleDirectory, "manifest.ts"),
        "A user-defined Module must have a valid ID without whitespace.",
      );
    }

    if (manifest.id?.startsWith("cloudigniter.")) {
      ciAddError(
        resolve(moduleDirectory, "manifest.ts"),
        'The "cloudigniter." Module namespace is reserved for core Modules.',
      );
    }
  }

  if (typeof manifest.name !== "string" || !manifest.name.trim()) {
    ciAddError(
      resolve(moduleDirectory, "manifest.ts"),
      "The Module name must be a non-empty string.",
    );
  }

  if (
    !manifest.runtime ||
    (manifest.runtime.client !== true && manifest.runtime.server !== true)
  ) {
    ciAddError(
      resolve(moduleDirectory, "manifest.ts"),
      "The Module must enable at least one client or server facet.",
    );
  }

  if (manifest.target?.framework !== "next") {
    ciAddError(
      resolve(moduleDirectory, "manifest.ts"),
      'Modules validated by the CloudIgniter Next Module system must target framework "next".',
    );
  }

  for (const dependency of manifest.packageDependencies ?? []) {
    if (typeof dependency.name !== "string" || !dependency.name.trim()) {
      ciAddError(
        resolve(moduleDirectory, "manifest.ts"),
        "A package dependency has an invalid name.",
      );
    }

    if (
      typeof dependency.specifier !== "string" ||
      !dependency.specifier.trim()
    ) {
      ciAddError(
        resolve(moduleDirectory, "manifest.ts"),
        `Package "${dependency.name}" has an invalid specifier.`,
      );
    }

    if (
      !Array.isArray(dependency.sections) ||
      dependency.sections.length === 0
    ) {
      ciAddError(
        resolve(moduleDirectory, "manifest.ts"),
        `Package "${dependency.name}" must declare at least one section.`,
      );

      continue;
    }

    for (const section of dependency.sections) {
      if (!ciPackageSections.has(section)) {
        ciAddError(
          resolve(moduleDirectory, "manifest.ts"),
          `Package "${dependency.name}" uses invalid ` +
            `package.json section "${section}".`,
        );
      }
    }
  }
}

/**
 * Validates that a runtime folder matches the manifest.
 */
async function ciValidateRuntimeFolder(moduleDirectory, manifest, environment) {
  const runtimeDirectory = resolve(moduleDirectory, environment);

  const runtimeEnabled = manifest?.runtime?.[environment] === true;

  const runtimeDirectoryExists = await ciPathExists(runtimeDirectory);

  if (runtimeEnabled && !runtimeDirectoryExists) {
    ciAddError(
      runtimeDirectory,
      `The manifest enables the ${environment} facet, ` +
        `but the ${environment}/ folder does not exist.`,
    );

    return;
  }

  if (!runtimeEnabled && runtimeDirectoryExists) {
    ciAddError(
      runtimeDirectory,
      `The ${environment}/ folder exists, but the manifest ` +
        `does not enable the ${environment} facet.`,
    );

    return;
  }

  if (!runtimeDirectoryExists) {
    return;
  }

  const indexPath = resolve(runtimeDirectory, "index.ts");

  if (!(await ciPathExists(indexPath))) {
    ciAddError(indexPath, `${environment}/ must contain index.ts.`);
  }
}

/**
 * Validates the types directory convention.
 */
async function ciValidateTypesDirectory(typesDirectory) {
  const entries = await readdir(typesDirectory, {
    withFileTypes: true,
  });

  const typeFiles = entries
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.endsWith(".ts") &&
        entry.name !== "index.ts",
    )
    .sort((left, right) => left.name.localeCompare(right.name));

  const indexPath = resolve(typesDirectory, "index.ts");

  if (!(await ciPathExists(indexPath))) {
    ciAddError(indexPath, "types/ must contain index.ts.");

    return;
  }

  const indexSource = await ciLoadTypeScriptSource(indexPath);

  const exportedPaths = new Set();

  for (const statement of indexSource.statements) {
    if (
      !ts.isExportDeclaration(statement) ||
      !statement.moduleSpecifier ||
      !ts.isStringLiteral(statement.moduleSpecifier)
    ) {
      continue;
    }

    if (!statement.isTypeOnly) {
      ciAddError(
        indexPath,
        "types/index.ts must use explicit " +
          '"export type { ... }" declarations.',
      );
    }

    exportedPaths.add(statement.moduleSpecifier.text.replace(/\.ts$/, ""));
  }

  for (const typeFile of typeFiles) {
    const typeFilePath = resolve(typesDirectory, typeFile.name);

    const sourceFile = await ciLoadTypeScriptSource(typeFilePath);

    const exportedTypes = sourceFile.statements.filter(
      (statement) =>
        (ts.isTypeAliasDeclaration(statement) ||
          ts.isInterfaceDeclaration(statement)) &&
        ciHasModifier(statement, ts.SyntaxKind.ExportKeyword),
    );

    if (exportedTypes.length !== 1) {
      ciAddError(
        typeFilePath,
        "Each type file must export exactly one type or interface.",
      );

      continue;
    }

    const exportedTypeName = exportedTypes[0].name.text;

    const expectedFileName = `${exportedTypeName}.ts`;

    if (typeFile.name !== expectedFileName) {
      ciAddError(typeFilePath, `The filename must be "${expectedFileName}".`);
    }

    const expectedExportPath = `./${basename(typeFile.name, ".ts")}`;

    if (!exportedPaths.has(expectedExportPath)) {
      ciAddError(
        indexPath,
        `Missing explicit export for "${expectedExportPath}".`,
      );
    }
  }
}

/**
 * Validates one Module directory.
 */
async function ciValidateModuleDirectory(moduleEntry) {
  const moduleName = moduleEntry.name;
  const moduleDirectory = resolve(ciModulesDirectory, moduleName);

  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(moduleName)) {
    ciAddError(
      moduleDirectory,
      "Module folder names must use lowercase kebab-case.",
    );
  }

  const entries = await readdir(moduleDirectory, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    if (entry.name === ".DS_Store") {
      continue;
    }

    if (!ciAllowedModuleRootEntries.has(entry.name)) {
      ciAddError(
        resolve(moduleDirectory, entry.name),
        `Unexpected Module root entry "${entry.name}".`,
      );
    }
  }

  const rootIndexPath = resolve(moduleDirectory, "index.ts");

  if (await ciPathExists(rootIndexPath)) {
    ciAddError(rootIndexPath, "A Module root barrel is not allowed.");
  }

  const manifestPath = resolve(moduleDirectory, "manifest.ts");

  if (!(await ciPathExists(manifestPath))) {
    ciAddError(manifestPath, "Every Module must contain manifest.ts.");

    return undefined;
  }

  const libDirectory = resolve(moduleDirectory, "lib");
  const typesDirectory = resolve(moduleDirectory, "types");

  if (!(await ciPathExists(libDirectory))) {
    ciAddError(libDirectory, "Every Module must contain lib/.");
  } else if (!(await ciPathExists(resolve(libDirectory, "index.ts")))) {
    ciAddError(
      resolve(libDirectory, "index.ts"),
      "lib/ must contain index.ts.",
    );
  }

  const typesDirectoryExists = await ciPathExists(typesDirectory);

  if (ciModuleKind === "core") {
    if (typesDirectoryExists) {
      ciAddError(
        typesDirectory,
        "Core Modules must not contain a local types/ directory. " +
          "Their public types must be declared in " +
          '"@cloudigniter/core/types".',
      );
    }
  } else if (!typesDirectoryExists) {
    ciAddError(
      typesDirectory,
      "User-defined Modules must contain a types/ directory.",
    );
  } else {
    await ciValidateTypesDirectory(typesDirectory);
  }

  await ciValidateManifestSource(manifestPath);

  let manifest;

  try {
    const manifestModule = await import(pathToFileURL(manifestPath).href);

    manifest = manifestModule.ciModuleManifest;
  } catch (error) {
    ciAddError(
      manifestPath,
      `Could not load manifest.ts: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );

    return undefined;
  }

  ciValidateManifestValue(moduleName, moduleDirectory, manifest, ciModuleKind);

  for (const environment of ciRuntimeEnvironments) {
    await ciValidateRuntimeFolder(moduleDirectory, manifest, environment);
  }

  for (const sourceArea of ["client", "server", "lib", "types"]) {
    const sourceDirectory = resolve(moduleDirectory, sourceArea);

    const files = await ciCollectTypeScriptFiles(sourceDirectory);

    for (const filePath of files) {
      await ciValidateSourceConventions(filePath);

      await ciValidateImportBoundaries(moduleDirectory, filePath, sourceArea);
    }
  }

  return manifest;
}

/**
 * Loads Module manifests used only as dependency references.
 *
 * Reference Modules are not structurally validated by the current validation
 * run. Core Module structure is validated by the dedicated core validation
 * command.
 */
async function ciLoadReferenceManifests(modulesDirectory) {
  if (!(await ciPathExists(modulesDirectory))) {
    return [];
  }

  const entries = await readdir(modulesDirectory, {
    withFileTypes: true,
  });

  const moduleEntries = entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .sort((left, right) => left.name.localeCompare(right.name));

  const manifests = [];

  for (const moduleEntry of moduleEntries) {
    const manifestPath = resolve(
      modulesDirectory,
      moduleEntry.name,
      "manifest.ts",
    );

    if (!(await ciPathExists(manifestPath))) {
      continue;
    }

    try {
      const manifestModule = await import(pathToFileURL(manifestPath).href);

      if (manifestModule.ciModuleManifest) {
        manifests.push(manifestModule.ciModuleManifest);
      }
    } catch (error) {
      ciAddError(
        manifestPath,
        `Could not load reference manifest.ts: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  return manifests;
}

/**
 * Validates Module dependency graphs for every declared cloud profile.
 */
function ciValidateModuleGraphs(manifests) {
  const clouds = new Set();

  for (const manifest of manifests) {
    for (const cloud of manifest.target.clouds ?? []) {
      clouds.add(cloud);
    }
  }

  const cloudProfiles = clouds.size > 0 ? [...clouds].sort() : [undefined];

  for (const cloud of cloudProfiles) {
    const eligibleModuleIds = manifests
      .filter(
        (manifest) =>
          !manifest.target.clouds || manifest.target.clouds.includes(cloud),
      )
      .map((manifest) => manifest.id);

    const disabledModuleIds = manifests
      .filter(
        (manifest) =>
          manifest.target.clouds && !manifest.target.clouds.includes(cloud),
      )
      .map((manifest) => manifest.id);

    try {
      ciResolveModuleGraph(manifests, {
        host: {
          framework: "next",
          ...(cloud ? { cloud } : {}),
        },
        enabled: eligibleModuleIds,
        disabled: disabledModuleIds,
      });
    } catch (error) {
      ciAddError(
        ciModulesDirectory,
        `Module graph validation failed for cloud ` +
          `"${cloud ?? "agnostic"}": ${
            error instanceof Error ? error.message : String(error)
          }`,
      );
    }
  }
}

/**
 * Runs Module validation.
 */
async function ciValidateModules() {
  const entries = await readdir(ciModulesDirectory, {
    withFileTypes: true,
  });

  const moduleEntries = entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .sort((left, right) => left.name.localeCompare(right.name));

  const manifests = [];

  for (const moduleEntry of moduleEntries) {
    const manifest = await ciValidateModuleDirectory(moduleEntry);

    if (manifest) {
      manifests.push(manifest);
    }
  }

  const referenceManifests =
    ciModuleKind === "user"
      ? await ciLoadReferenceManifests(ciCoreModulesDirectory)
      : [];

  const graphManifests = [...referenceManifests, ...manifests];

  if (ciErrors.length === 0) {
    try {
      ciCollectModulePackageDependencies(graphManifests);
    } catch (error) {
      ciAddError(
        ciModulesDirectory,
        error instanceof Error ? error.message : String(error),
      );
    }

    ciValidateModuleGraphs(graphManifests);
  }

  if (ciErrors.length > 0) {
    console.error(
      `\n❌ Module validation failed with ` + `${ciErrors.length} error(s):\n`,
    );

    for (const error of ciErrors) {
      console.error(`- ${error.filePath}\n  ${error.message}`);
    }

    process.exitCode = 1;
    return;
  }

  console.log(`✅ Validated ${manifests.length} ${ciModuleKind} Module(s).`);
}

await ciValidateModules();
