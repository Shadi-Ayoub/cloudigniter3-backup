import { constants } from "node:fs";
import { lstat, open, readdir, realpath } from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";

import { ciImportPackageEntry } from "../ci-import-package-entry.mjs";
import {
  ciReadResourceFileTransaction,
  ciRollbackResourceFileTransaction,
  ciRunResourceFileTransaction,
} from "../ci-resource-file-transaction.mjs";

const CI_DATA_ENTITY_DIRECTORY = "amplify/custom/data/schemata/data-entities";
const CI_TRANSACTION_DIRECTORY =
  ".cloudigniter/local/resource-studio/transactions";
const CI_RESOURCE_ID_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

export class CiResourceStudioError extends Error {
  constructor(message, options = {}) {
    super(message, options.cause ? { cause: options.cause } : undefined);
    this.name = "CiResourceStudioError";
    this.code = options.code ?? "CI_RESOURCE_STUDIO_ERROR";
    this.statusCode = options.statusCode ?? 400;
    this.conflicts = options.conflicts ?? [];
  }
}

function ciStudioError(message, code, options = {}) {
  return new CiResourceStudioError(message, { ...options, code });
}

function ciIsMissing(error) {
  return error?.code === "ENOENT";
}

function ciAssertResourceId(id) {
  if (typeof id !== "string" || !CI_RESOURCE_ID_PATTERN.test(id)) {
    throw ciStudioError(
      "Data Entity IDs must use lowercase kebab-case.",
      "CI_RESOURCE_STUDIO_INVALID_ENTITY_ID",
    );
  }
  return id;
}

function ciNormalizePlannerPath(value) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.includes("\0") ||
    value.includes("\\") ||
    path.posix.isAbsolute(value) ||
    path.win32.isAbsolute(value)
  ) {
    throw ciStudioError(
      `A planner returned an unsafe generated path: ${String(value)}`,
      "CI_RESOURCE_STUDIO_UNSAFE_PLANNER_PATH",
      { statusCode: 500 },
    );
  }

  const segments = value.split("/");
  if (
    segments.some((segment) => !segment || segment === "." || segment === "..")
  ) {
    throw ciStudioError(
      `A planner returned an unsafe generated path: ${value}`,
      "CI_RESOURCE_STUDIO_UNSAFE_PLANNER_PATH",
      { statusCode: 500 },
    );
  }
  return segments.join("/");
}

function ciAssertPlannerFile(file, provider) {
  if (!file || typeof file !== "object" || file.ownership !== "generated") {
    throw ciStudioError(
      `${provider} returned an invalid Resource Studio file plan.`,
      "CI_RESOURCE_STUDIO_INVALID_PLAN",
      { statusCode: 500 },
    );
  }
  const generatedPath = ciNormalizePlannerPath(file.path);
  if (typeof file.content !== "string") {
    throw ciStudioError(
      `${provider} returned non-text content for ${generatedPath}.`,
      "CI_RESOURCE_STUDIO_INVALID_PLAN",
      { statusCode: 500 },
    );
  }

  const allowed =
    provider === "AWS"
      ? generatedPath.startsWith("amplify/custom/data/schemata/")
      : generatedPath === "src/custom/routes/resource-studio.generated.ts" ||
        generatedPath.startsWith(
          "src/app/(ci-global)/ci-global/(ci-custom)/",
        ) ||
        generatedPath.startsWith("src/app/(ci-tenant)/ci-tenant/(ci-custom)/");
  if (!allowed) {
    throw ciStudioError(
      `${provider} attempted to generate outside its Resource Studio roots: ${generatedPath}`,
      "CI_RESOURCE_STUDIO_UNSAFE_PLANNER_PATH",
      { statusCode: 500 },
    );
  }

  return { ...file, path: generatedPath };
}

async function ciResolveApplicationRoot(applicationRoot) {
  const resolved = path.resolve(applicationRoot);
  let stats;
  try {
    stats = await lstat(resolved);
  } catch (error) {
    throw ciStudioError(
      `The application root does not exist: ${resolved}`,
      "CI_RESOURCE_STUDIO_INVALID_APPLICATION_ROOT",
      { cause: error },
    );
  }
  if (stats.isSymbolicLink() || !stats.isDirectory()) {
    throw ciStudioError(
      `The application root must be a real directory: ${resolved}`,
      "CI_RESOURCE_STUDIO_INVALID_APPLICATION_ROOT",
    );
  }
  return realpath(resolved);
}

async function ciInspectWorkspacePath(applicationRoot, relativePath) {
  const normalized = ciNormalizePlannerPath(relativePath);
  let current = applicationRoot;
  const segments = normalized.split("/");
  for (const [index, segment] of segments.entries()) {
    current = path.join(current, segment);
    try {
      const stats = await lstat(current);
      if (stats.isSymbolicLink()) {
        throw ciStudioError(
          `Resource Studio paths cannot traverse symlinks: ${normalized}`,
          "CI_RESOURCE_STUDIO_SYMLINK_PATH",
        );
      }
      if (index < segments.length - 1 && !stats.isDirectory()) {
        throw ciStudioError(
          `Resource Studio path traverses a non-directory: ${normalized}`,
          "CI_RESOURCE_STUDIO_INVALID_PATH",
        );
      }
      if (index === segments.length - 1 && !stats.isFile()) {
        throw ciStudioError(
          `Resource Studio expected a regular file: ${normalized}`,
          "CI_RESOURCE_STUDIO_INVALID_PATH",
        );
      }
    } catch (error) {
      if (ciIsMissing(error)) return { exists: false, path: current };
      throw error;
    }
  }
  return { exists: true, path: current };
}

async function ciInspectWorkspaceDirectory(applicationRoot, relativePath) {
  const normalized = ciNormalizePlannerPath(relativePath);
  let current = applicationRoot;
  for (const segment of normalized.split("/")) {
    current = path.join(current, segment);
    try {
      const stats = await lstat(current);
      if (stats.isSymbolicLink() || !stats.isDirectory()) {
        throw ciStudioError(
          `Resource Studio directory paths cannot traverse symlinks or files: ${normalized}`,
          "CI_RESOURCE_STUDIO_SYMLINK_PATH",
        );
      }
    } catch (error) {
      if (ciIsMissing(error)) return undefined;
      throw error;
    }
  }
  return current;
}

async function ciReadWorkspaceFile(applicationRoot, relativePath) {
  const inspection = await ciInspectWorkspacePath(
    applicationRoot,
    relativePath,
  );
  if (!inspection.exists) return undefined;
  const handle = await open(
    inspection.path,
    constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
  );
  try {
    const stats = await handle.stat();
    if (!stats.isFile()) {
      throw ciStudioError(
        `Resource Studio expected a regular file: ${relativePath}`,
        "CI_RESOURCE_STUDIO_INVALID_PATH",
      );
    }
    return handle.readFile();
  } finally {
    await handle.close();
  }
}

async function ciReadDataEntityDescriptors(applicationRoot) {
  const directoryPath = await ciInspectWorkspaceDirectory(
    applicationRoot,
    CI_DATA_ENTITY_DIRECTORY,
  );
  if (!directoryPath) return [];

  const descriptors = [];
  const entries = await readdir(directoryPath, { withFileTypes: true });
  for (const entry of entries.sort((left, right) =>
    left.name.localeCompare(right.name),
  )) {
    if (!CI_RESOURCE_ID_PATTERN.test(entry.name)) continue;
    const relativePath = `${CI_DATA_ENTITY_DIRECTORY}/${entry.name}/entity.ci.json`;
    const bytes = await ciReadWorkspaceFile(applicationRoot, relativePath);
    if (!bytes) continue;
    try {
      descriptors.push(JSON.parse(bytes.toString("utf8")));
    } catch (error) {
      throw ciStudioError(
        `The Data Entity descriptor is invalid JSON: ${relativePath}`,
        "CI_RESOURCE_STUDIO_INVALID_DESCRIPTOR",
        { cause: error },
      );
    }
  }
  return descriptors;
}

function ciValidatePlannerModule(module, names, packageName) {
  for (const name of names) {
    if (
      !(name in module) ||
      (name !== "CI_AWS_RESOURCE_STUDIO_CAPABILITIES" &&
        typeof module[name] !== "function")
    ) {
      throw ciStudioError(
        `${packageName} does not provide the required Resource Studio planner API (${name}).`,
        "CI_RESOURCE_STUDIO_PLANNER_UNAVAILABLE",
        { statusCode: 500 },
      );
    }
  }
  return module;
}

export async function ciLoadResourceStudioPlanners({ applicationRoot }) {
  const [aws, next, core] = await Promise.all([
    ciImportPackageEntry({
      baseDirectory: applicationRoot,
      packageName: "@cloudigniter/aws",
      subpath: "server/backend",
    }),
    ciImportPackageEntry({
      baseDirectory: applicationRoot,
      packageName: "@cloudigniter/next",
      subpath: "lib",
    }),
    ciImportPackageEntry({
      baseDirectory: applicationRoot,
      packageName: "@cloudigniter/core",
      subpath: "lib",
    }),
  ]);
  return {
    aws: ciValidatePlannerModule(
      aws,
      [
        "CI_AWS_RESOURCE_STUDIO_CAPABILITIES",
        "ciNormalizeAwsDataEntityDescriptor",
        "ciPlanAwsDataEntities",
      ],
      "@cloudigniter/aws/server/backend",
    ),
    next: ciValidatePlannerModule(
      next,
      ["ciPlanNextDataEntities"],
      "@cloudigniter/next/lib",
    ),
    core,
  };
}

async function ciImportOptionalApplicationModule(
  applicationRoot,
  relativePath,
) {
  const inspection = await ciInspectWorkspacePath(
    applicationRoot,
    relativePath,
  );
  if (!inspection.exists) return undefined;
  return import(
    `${pathToFileURL(inspection.path).href}?ci_resource_studio=${randomUUID()}`
  );
}

function ciManualRoutePaths(source) {
  const declaration = source.match(
    /const\s+manualCustomRoutes\s*=\s*\{([\s\S]*)\}\s*satisfies\s+CiRoutesMap/,
  );
  if (!declaration) return [];
  return [...declaration[1].matchAll(/(["'])(\/[^"']*)\1\s*:/g)].map(
    (match) => match[2],
  );
}

export async function ciInspectResourceStudioReservations({
  applicationRoot,
  planners,
  currentDescriptors,
}) {
  const routePaths = new Set(Object.keys(planners.core?.ciCoreRoutes ?? {}));
  const manualRoutes = await ciReadWorkspaceFile(
    applicationRoot,
    "src/custom/routes/routes.ts",
  );
  if (manualRoutes) {
    for (const routePath of ciManualRoutePaths(manualRoutes.toString("utf8"))) {
      routePaths.add(routePath);
    }
  }

  const modelNames = new Set();
  const coreSchemas = await ciImportOptionalApplicationModule(
    applicationRoot,
    "amplify/data/schemata/index.ts",
  );
  for (const modelName of Object.keys(coreSchemas?.coreSchemas ?? {})) {
    modelNames.add(modelName);
  }
  const customSchemas = await ciImportOptionalApplicationModule(
    applicationRoot,
    "amplify/custom/data/schemata/index.ts",
  );
  for (const modelName of Object.keys(customSchemas?.default ?? {})) {
    modelNames.add(modelName);
  }
  // The custom schema export intentionally includes the generated registry.
  // Remove only models provably owned by the descriptors loaded this session.
  for (const descriptor of currentDescriptors) {
    modelNames.delete(descriptor.dataStore.modelName);
  }
  return { routePaths: [...routePaths], modelNames: [...modelNames] };
}

function ciRouteIsReserved(routePath, reservedPath) {
  if (routePath === reservedPath) return true;
  if (reservedPath.endsWith("/*")) {
    return routePath.startsWith(reservedPath.slice(0, -1));
  }
  return false;
}

function ciAssertDescriptorReservations(descriptors, reservations) {
  const routeConflicts = [];
  const modelConflicts = [];
  for (const descriptor of descriptors) {
    const reservedRoute = reservations.routePaths.find((routePath) =>
      ciRouteIsReserved(descriptor.managementPage.path, routePath),
    );
    if (reservedRoute) {
      routeConflicts.push({
        entityId: descriptor.id,
        path: descriptor.managementPage.path,
        reservedBy: reservedRoute,
      });
    }
    if (reservations.modelNames.includes(descriptor.dataStore.modelName)) {
      modelConflicts.push({
        entityId: descriptor.id,
        modelName: descriptor.dataStore.modelName,
      });
    }
  }
  if (routeConflicts.length > 0 || modelConflicts.length > 0) {
    throw ciStudioError(
      "A Data Entity model or management route collides with an application-owned resource.",
      "CI_RESOURCE_STUDIO_RESOURCE_COLLISION",
      {
        conflicts: [...routeConflicts, ...modelConflicts],
        statusCode: 409,
      },
    );
  }
}

function ciCreatePlan(planners, descriptors) {
  const awsPlan = planners.aws.ciPlanAwsDataEntities({ descriptors });
  const nextPlan = planners.next.ciPlanNextDataEntities({
    entities: awsPlan.frontend,
  });
  if (!Array.isArray(awsPlan.files) || !Array.isArray(nextPlan.files)) {
    throw ciStudioError(
      "A Resource Studio planner returned an invalid file list.",
      "CI_RESOURCE_STUDIO_INVALID_PLAN",
      { statusCode: 500 },
    );
  }
  const files = [
    ...awsPlan.files.map((file) => ciAssertPlannerFile(file, "AWS")),
    ...nextPlan.files.map((file) => ciAssertPlannerFile(file, "Next.js")),
  ];
  const seen = new Set();
  for (const file of files) {
    if (seen.has(file.path)) {
      throw ciStudioError(
        `Resource Studio planners returned the same path twice: ${file.path}`,
        "CI_RESOURCE_STUDIO_PLAN_COLLISION",
        { statusCode: 500 },
      );
    }
    seen.add(file.path);
  }
  return {
    descriptors: awsPlan.descriptors,
    files,
    warnings: Array.isArray(awsPlan.warnings) ? awsPlan.warnings : [],
  };
}

async function ciAssertGeneratedPlanMatchesWorkspace(applicationRoot, plan) {
  const driftConflicts = [];
  for (const file of plan.files) {
    const current = await ciReadWorkspaceFile(applicationRoot, file.path);
    const expected = Buffer.from(file.content, "utf8");
    if (!current?.equals(expected)) {
      driftConflicts.push({
        path: file.path,
        expected: {
          kind: "file",
          sha256: createHash("sha256").update(expected).digest("hex"),
          size: expected.byteLength,
        },
        actual: current
          ? {
              kind: "file",
              sha256: createHash("sha256").update(current).digest("hex"),
              size: current.byteLength,
            }
          : { kind: "absent" },
      });
    }
  }
  if (driftConflicts.length > 0) {
    throw ciStudioError(
      "Generated Data Entity files changed outside Resource Studio. Restore those files before updating or dropping the entity.",
      "CI_RESOURCE_STUDIO_GENERATED_DRIFT",
      { conflicts: driftConflicts, statusCode: 409 },
    );
  }
}

function ciHashGeneratedPlan(plan) {
  const hash = createHash("sha256");
  hash.update("cloudigniter-resource-studio-plan\0v1\0");
  for (const file of [...plan.files].sort((left, right) =>
    left.path < right.path ? -1 : left.path > right.path ? 1 : 0,
  )) {
    const content = Buffer.from(file.content, "utf8");
    hash.update(String(Buffer.byteLength(file.path, "utf8")));
    hash.update("\0");
    hash.update(file.path);
    hash.update("\0");
    hash.update(String(content.byteLength));
    hash.update("\0");
    hash.update(content);
    hash.update("\0");
  }
  return hash.digest("hex");
}

async function ciBuildFileChanges(applicationRoot, beforePlan, afterPlan) {
  await ciAssertGeneratedPlanMatchesWorkspace(applicationRoot, beforePlan);

  const beforeByPath = new Map(
    beforePlan.files.map((file) => [file.path, file]),
  );
  const afterByPath = new Map(afterPlan.files.map((file) => [file.path, file]));
  const ownershipConflicts = [];
  for (const [generatedPath, after] of afterByPath) {
    if (beforeByPath.has(generatedPath)) continue;
    const current = await ciReadWorkspaceFile(applicationRoot, generatedPath);
    if (!current) continue;
    const expected = Buffer.from(after.content, "utf8");
    ownershipConflicts.push({
      path: generatedPath,
      expected: { kind: "absent" },
      actual: {
        kind: "file",
        sha256: createHash("sha256").update(current).digest("hex"),
        size: current.byteLength,
      },
      planned: {
        kind: "file",
        sha256: createHash("sha256").update(expected).digest("hex"),
        size: expected.byteLength,
      },
    });
  }
  if (ownershipConflicts.length > 0) {
    throw ciStudioError(
      "Resource Studio will not overwrite files it does not already own. Move or rename the colliding files before continuing.",
      "CI_RESOURCE_STUDIO_OWNERSHIP_COLLISION",
      { conflicts: ownershipConflicts, statusCode: 409 },
    );
  }

  const paths = [
    ...new Set([...beforeByPath.keys(), ...afterByPath.keys()]),
  ].sort();
  const changes = [];
  for (const generatedPath of paths) {
    const current = await ciReadWorkspaceFile(applicationRoot, generatedPath);
    const after = afterByPath.get(generatedPath);
    if (!after) {
      if (current) changes.push({ path: generatedPath, delete: true });
      continue;
    }
    const content = Buffer.from(after.content, "utf8");
    if (current?.equals(content)) continue;
    changes.push({ path: generatedPath, content });
  }
  return changes;
}

async function ciReadHistory(applicationRoot) {
  const directory = await ciInspectWorkspaceDirectory(
    applicationRoot,
    CI_TRANSACTION_DIRECTORY,
  );
  if (!directory) return [];
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (ciIsMissing(error)) return [];
    throw error;
  }

  const history = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
    try {
      const journal = await ciReadResourceFileTransaction({
        applicationRoot,
        transactionId: entry.name,
      });
      if (journal.metadata?.resourceStudio !== true) continue;
      history.push({
        transactionId: journal.transactionId,
        operation: journal.metadata.operation,
        entityId: journal.metadata.entityId,
        status: journal.status,
        createdAt: journal.createdAt,
        appliedAt: journal.appliedAt,
        rolledBackAt: journal.rolledBackAt,
        updatedAt: journal.updatedAt,
      });
    } catch (error) {
      throw ciStudioError(
        `Resource Studio transaction history cannot be read: ${entry.name}`,
        "CI_RESOURCE_STUDIO_CORRUPT_HISTORY",
        { cause: error, statusCode: 500 },
      );
    }
  }
  return history
    .sort((left, right) =>
      String(right.appliedAt ?? right.createdAt).localeCompare(
        String(left.appliedAt ?? left.createdAt),
      ),
    )
    .slice(0, 50);
}

function ciNewTransactionId(operation, id) {
  return `rs-${operation}-${id}-${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`;
}

export async function ciCreateResourceStudioService({
  applicationRoot,
  loadPlanners = ciLoadResourceStudioPlanners,
  inspectReservations = ciInspectResourceStudioReservations,
}) {
  const root = await ciResolveApplicationRoot(applicationRoot);
  let plannersPromise;
  const getPlanners = async () => {
    plannersPromise ??= Promise.resolve(
      loadPlanners({ applicationRoot: root }),
    );
    return plannersPromise;
  };

  const readPlan = async () => {
    const planners = await getPlanners();
    const descriptors = await ciReadDataEntityDescriptors(root);
    return { planners, plan: ciCreatePlan(planners, descriptors) };
  };

  const mutate = async ({
    operation,
    entityId,
    descriptors,
    beforePlan,
    planners,
  }) => {
    let afterPlan;
    try {
      afterPlan = ciCreatePlan(planners, descriptors);
    } catch (error) {
      if (error instanceof CiResourceStudioError) throw error;
      throw ciStudioError(
        error instanceof Error
          ? error.message
          : "The Data Entity plan is invalid.",
        "CI_RESOURCE_STUDIO_INVALID_DESCRIPTOR",
        { cause: error },
      );
    }
    const reservations = await inspectReservations({
      applicationRoot: root,
      planners,
      currentDescriptors: beforePlan.descriptors,
    });
    ciAssertDescriptorReservations(afterPlan.descriptors, reservations);
    const changes = await ciBuildFileChanges(root, beforePlan, afterPlan);
    if (changes.length === 0) {
      return {
        status: "unchanged",
        transactionId: null,
        warnings: afterPlan.warnings,
      };
    }
    const transactionId = ciNewTransactionId(operation, entityId);
    const result = await ciRunResourceFileTransaction({
      applicationRoot: root,
      transactionId,
      changes,
      metadata: {
        resourceStudio: true,
        schemaVersion: 1,
        operation,
        entityId,
      },
    });
    return {
      status: result.status,
      transactionId,
      conflicts: result.conflicts,
      warnings: afterPlan.warnings,
    };
  };

  return {
    applicationRoot: root,

    async getState() {
      const { planners, plan } = await readPlan();
      return {
        schemaVersion: 1,
        applicationRoot: root,
        capabilities: structuredClone(
          planners.aws.CI_AWS_RESOURCE_STUDIO_CAPABILITIES,
        ),
        entities: structuredClone(plan.descriptors),
        warnings: [...plan.warnings],
        history: await ciReadHistory(root),
      };
    },

    async getDeploymentPlanHash() {
      const { plan } = await readPlan();
      await ciAssertGeneratedPlanMatchesWorkspace(root, plan);
      return ciHashGeneratedPlan(plan);
    },

    async createEntity(value) {
      const { planners, plan } = await readPlan();
      let descriptor;
      try {
        descriptor = planners.aws.ciNormalizeAwsDataEntityDescriptor(value);
      } catch (error) {
        throw ciStudioError(
          error instanceof Error
            ? error.message
            : "The Data Entity is invalid.",
          "CI_RESOURCE_STUDIO_INVALID_DESCRIPTOR",
          { cause: error },
        );
      }
      if (plan.descriptors.some((item) => item.id === descriptor.id)) {
        throw ciStudioError(
          `Data Entity "${descriptor.id}" already exists.`,
          "CI_RESOURCE_STUDIO_ENTITY_EXISTS",
          { statusCode: 409 },
        );
      }
      return mutate({
        operation: "create",
        entityId: descriptor.id,
        descriptors: [...plan.descriptors, descriptor],
        beforePlan: plan,
        planners,
      });
    },

    async updateEntity(id, value) {
      ciAssertResourceId(id);
      const { planners, plan } = await readPlan();
      const index = plan.descriptors.findIndex((item) => item.id === id);
      if (index < 0) {
        throw ciStudioError(
          `Data Entity "${id}" does not exist.`,
          "CI_RESOURCE_STUDIO_ENTITY_NOT_FOUND",
          { statusCode: 404 },
        );
      }
      let descriptor;
      try {
        descriptor = planners.aws.ciNormalizeAwsDataEntityDescriptor(value);
      } catch (error) {
        throw ciStudioError(
          error instanceof Error
            ? error.message
            : "The Data Entity is invalid.",
          "CI_RESOURCE_STUDIO_INVALID_DESCRIPTOR",
          { cause: error },
        );
      }
      if (descriptor.id !== id) {
        throw ciStudioError(
          "A Data Entity ID is immutable; create a new entity to use another ID.",
          "CI_RESOURCE_STUDIO_ENTITY_ID_IMMUTABLE",
        );
      }
      const descriptors = [...plan.descriptors];
      descriptors[index] = descriptor;
      return mutate({
        operation: "update",
        entityId: id,
        descriptors,
        beforePlan: plan,
        planners,
      });
    },

    async dropEntity(id) {
      ciAssertResourceId(id);
      const { planners, plan } = await readPlan();
      if (!plan.descriptors.some((item) => item.id === id)) {
        throw ciStudioError(
          `Data Entity "${id}" does not exist.`,
          "CI_RESOURCE_STUDIO_ENTITY_NOT_FOUND",
          { statusCode: 404 },
        );
      }
      return mutate({
        operation: "drop",
        entityId: id,
        descriptors: plan.descriptors.filter((item) => item.id !== id),
        beforePlan: plan,
        planners,
      });
    },

    async undo(transactionId) {
      const history = await ciReadHistory(root);
      const target = transactionId
        ? history.find((entry) => entry.transactionId === transactionId)
        : history.find((entry) => entry.status === "applied");
      if (!target) {
        throw ciStudioError(
          "There is no applied Resource Studio transaction to undo.",
          "CI_RESOURCE_STUDIO_NOTHING_TO_UNDO",
          { statusCode: 409 },
        );
      }
      if (target.status !== "applied") {
        throw ciStudioError(
          `Resource Studio transaction ${target.transactionId} is not applied.`,
          "CI_RESOURCE_STUDIO_TRANSACTION_NOT_APPLIED",
          { statusCode: 409 },
        );
      }
      const result = await ciRollbackResourceFileTransaction({
        applicationRoot: root,
        transactionId: target.transactionId,
      });
      return {
        status: result.status,
        transactionId: target.transactionId,
        conflicts: result.conflicts,
      };
    },
  };
}
