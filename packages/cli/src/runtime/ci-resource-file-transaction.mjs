import { constants } from "node:fs";
import {
  chmod,
  link,
  lstat,
  mkdir,
  open,
  realpath,
  rename,
  rm,
  rmdir,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";

const CI_RESOURCE_FILE_TRANSACTION_SCHEMA_VERSION = 1;
const CI_RESOURCE_FILE_TRANSACTION_ROOT =
  ".cloudigniter/local/resource-studio/transactions";
const CI_RESOURCE_FILE_TRANSACTION_PROTECTED_ROOT =
  ".cloudigniter/local/resource-studio";
const CI_RESOURCE_FILE_DEFAULT_MODE = 0o644;
const CI_RESOURCE_DIRECTORY_DEFAULT_MODE = 0o755;
const CI_RESOURCE_PRIVATE_DIRECTORY_MODE = 0o700;
const CI_RESOURCE_PRIVATE_FILE_MODE = 0o600;
const CI_RESOURCE_FILE_MODE_MASK = 0o7777;
const CI_SHA256_PATTERN = /^[a-f0-9]{64}$/;
const CI_TRANSACTION_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
const CI_JOURNAL_STATUSES = new Set([
  "prepared",
  "applying",
  "applied",
  "rolling-back",
  "rolled-back",
  "failed-conflicted",
  "failed-rolled-back",
]);

/** Error raised when a transaction cannot be prepared, applied, or restored safely. */
export class CiResourceFileTransactionError extends Error {
  constructor(message, options = {}) {
    super(message, options.cause ? { cause: options.cause } : undefined);
    this.name = "CiResourceFileTransactionError";
    this.code = options.code ?? "CI_RESOURCE_FILE_TRANSACTION_ERROR";
    this.conflicts = options.conflicts ?? [];
  }
}

function ciTransactionError(message, code, options = {}) {
  return new CiResourceFileTransactionError(message, {
    ...options,
    code,
  });
}

function ciIsMissingError(error) {
  return error?.code === "ENOENT";
}

function ciHashBytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function ciNormalizeTransactionId(transactionId) {
  const value = transactionId ?? randomUUID();

  if (typeof value !== "string" || !CI_TRANSACTION_ID_PATTERN.test(value)) {
    throw ciTransactionError(
      "The resource file transaction ID must contain only letters, numbers, underscores, and hyphens.",
      "CI_RESOURCE_FILE_INVALID_TRANSACTION_ID",
    );
  }

  return value;
}

function ciNormalizeWorkspaceRelativePath(input, { internal = false } = {}) {
  if (typeof input !== "string" || input.length === 0 || input.includes("\0")) {
    throw ciTransactionError(
      "Resource file paths must be non-empty workspace-relative strings.",
      "CI_RESOURCE_FILE_INVALID_PATH",
    );
  }

  if (path.posix.isAbsolute(input) || path.win32.isAbsolute(input)) {
    throw ciTransactionError(
      `Resource file path must be relative to the application root: ${input}`,
      "CI_RESOURCE_FILE_PATH_OUTSIDE_ROOT",
    );
  }

  const segments = input.replaceAll("\\", "/").split("/");
  if (
    segments.some(
      (segment) => segment.length === 0 || segment === "." || segment === "..",
    )
  ) {
    throw ciTransactionError(
      `Resource file path contains an unsafe segment: ${input}`,
      "CI_RESOURCE_FILE_PATH_OUTSIDE_ROOT",
    );
  }

  const normalized = segments.join("/");
  if (
    !internal &&
    (normalized === CI_RESOURCE_FILE_TRANSACTION_PROTECTED_ROOT ||
      normalized.startsWith(`${CI_RESOURCE_FILE_TRANSACTION_PROTECTED_ROOT}/`))
  ) {
    throw ciTransactionError(
      `Resource changes cannot target the transaction journal: ${input}`,
      "CI_RESOURCE_FILE_PROTECTED_PATH",
    );
  }

  if (!internal && (normalized === ".git" || normalized.startsWith(".git/"))) {
    throw ciTransactionError(
      `Resource changes cannot target Git internals: ${input}`,
      "CI_RESOURCE_FILE_PROTECTED_PATH",
    );
  }

  return normalized;
}

async function ciResolveApplicationRoot(applicationRoot) {
  if (typeof applicationRoot !== "string" || applicationRoot.length === 0) {
    throw ciTransactionError(
      "An application root is required for a resource file transaction.",
      "CI_RESOURCE_FILE_INVALID_APPLICATION_ROOT",
    );
  }

  const requestedRoot = path.resolve(applicationRoot);
  let rootStats;
  try {
    rootStats = await lstat(requestedRoot);
  } catch (error) {
    throw ciTransactionError(
      `The application root does not exist: ${requestedRoot}`,
      "CI_RESOURCE_FILE_INVALID_APPLICATION_ROOT",
      { cause: error },
    );
  }

  if (rootStats.isSymbolicLink() || !rootStats.isDirectory()) {
    throw ciTransactionError(
      `The application root must be a real directory, not a symlink: ${requestedRoot}`,
      "CI_RESOURCE_FILE_INVALID_APPLICATION_ROOT",
    );
  }

  return realpath(requestedRoot);
}

function ciResolveConfinedAbsolutePath(applicationRoot, relativePath) {
  const absolutePath = path.resolve(
    applicationRoot,
    ...relativePath.split("/"),
  );
  const relativeToRoot = path.relative(applicationRoot, absolutePath);

  if (
    relativeToRoot.length === 0 ||
    relativeToRoot === ".." ||
    relativeToRoot.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativeToRoot)
  ) {
    throw ciTransactionError(
      `Resource file path escapes the application root: ${relativePath}`,
      "CI_RESOURCE_FILE_PATH_OUTSIDE_ROOT",
    );
  }

  return absolutePath;
}

async function ciInspectSafeWorkspacePath(applicationRoot, relativePath) {
  const normalized = ciNormalizeWorkspaceRelativePath(relativePath, {
    internal: true,
  });
  const segments = normalized.split("/");
  const missingDirectories = [];
  let currentPath = applicationRoot;
  let currentRelativePath = "";
  let ancestorMissing = false;
  let targetExists = false;

  for (const [index, segment] of segments.entries()) {
    currentPath = path.join(currentPath, segment);
    currentRelativePath = currentRelativePath
      ? `${currentRelativePath}/${segment}`
      : segment;
    const isTarget = index === segments.length - 1;

    if (ancestorMissing) {
      if (!isTarget) missingDirectories.push(currentRelativePath);
      continue;
    }

    let stats;
    try {
      stats = await lstat(currentPath);
    } catch (error) {
      if (!ciIsMissingError(error)) throw error;
      ancestorMissing = true;
      if (!isTarget) missingDirectories.push(currentRelativePath);
      continue;
    }

    if (stats.isSymbolicLink()) {
      throw ciTransactionError(
        `Resource file paths cannot traverse symlinks: ${currentRelativePath}`,
        "CI_RESOURCE_FILE_SYMLINK_PATH",
      );
    }

    if (!isTarget && !stats.isDirectory()) {
      throw ciTransactionError(
        `Resource file path traverses a non-directory: ${currentRelativePath}`,
        "CI_RESOURCE_FILE_INVALID_PATH",
      );
    }

    if (isTarget) {
      if (!stats.isFile()) {
        throw ciTransactionError(
          `Resource file target must be a regular file: ${currentRelativePath}`,
          "CI_RESOURCE_FILE_INVALID_PATH",
        );
      }
      targetExists = true;
    }
  }

  return {
    absolutePath: ciResolveConfinedAbsolutePath(applicationRoot, normalized),
    missingDirectories,
    relativePath: normalized,
    targetExists,
  };
}

async function ciReadWorkspaceFileState(applicationRoot, relativePath) {
  const inspection = await ciInspectSafeWorkspacePath(
    applicationRoot,
    relativePath,
  );
  if (!inspection.targetExists) return { kind: "absent" };

  const noFollowFlag = constants.O_NOFOLLOW ?? 0;
  let fileHandle;
  try {
    fileHandle = await open(
      inspection.absolutePath,
      constants.O_RDONLY | noFollowFlag,
    );
    const beforeStats = await fileHandle.stat();
    if (!beforeStats.isFile()) {
      throw ciTransactionError(
        `Resource file target must be a regular file: ${relativePath}`,
        "CI_RESOURCE_FILE_INVALID_PATH",
      );
    }

    const bytes = await fileHandle.readFile();
    const afterStats = await fileHandle.stat();
    if (
      beforeStats.ino !== afterStats.ino ||
      beforeStats.size !== afterStats.size ||
      beforeStats.mtimeMs !== afterStats.mtimeMs ||
      beforeStats.ctimeMs !== afterStats.ctimeMs
    ) {
      throw ciTransactionError(
        `Resource file changed while it was being snapshotted: ${relativePath}`,
        "CI_RESOURCE_FILE_CONCURRENT_CHANGE",
      );
    }

    return {
      kind: "file",
      bytes,
      mode: afterStats.mode & CI_RESOURCE_FILE_MODE_MASK,
      sha256: ciHashBytes(bytes),
      size: bytes.byteLength,
    };
  } catch (error) {
    if (ciIsMissingError(error)) return { kind: "absent" };
    throw error;
  } finally {
    await fileHandle?.close();
  }
}

function ciStateWithoutBytes(state) {
  if (state.kind === "absent") return state;
  const { bytes: _bytes, ...snapshot } = state;
  return snapshot;
}

function ciPublicState(state) {
  if (state.kind === "absent") return { kind: "absent" };
  return {
    kind: "file",
    mode: state.mode,
    sha256: state.sha256,
    size: state.size,
  };
}

function ciStatesMatch(actual, expected) {
  if (actual.kind !== expected.kind) return false;
  if (actual.kind === "absent") return true;
  return (
    actual.sha256 === expected.sha256 &&
    actual.size === expected.size &&
    actual.mode === expected.mode
  );
}

function ciNormalizeMode(mode, fallback) {
  const value = mode ?? fallback;
  if (
    !Number.isInteger(value) ||
    value < 0 ||
    value > CI_RESOURCE_FILE_MODE_MASK
  ) {
    throw ciTransactionError(
      `Invalid resource file mode: ${String(value)}`,
      "CI_RESOURCE_FILE_INVALID_MODE",
    );
  }
  return value;
}

function ciContentToBuffer(content) {
  if (typeof content === "string") return Buffer.from(content, "utf8");
  if (content instanceof Uint8Array) {
    return Buffer.from(content.buffer, content.byteOffset, content.byteLength);
  }
  throw ciTransactionError(
    "Resource file content must be a string or Uint8Array.",
    "CI_RESOURCE_FILE_INVALID_CONTENT",
  );
}

function ciNormalizeChanges(changes) {
  if (!Array.isArray(changes) || changes.length === 0) {
    throw ciTransactionError(
      "A resource file transaction requires at least one file change.",
      "CI_RESOURCE_FILE_EMPTY_TRANSACTION",
    );
  }

  const seenPaths = new Set();
  return changes
    .map((change) => {
      if (!change || typeof change !== "object") {
        throw ciTransactionError(
          "Each resource file change must be an object.",
          "CI_RESOURCE_FILE_INVALID_CHANGE",
        );
      }

      const relativePath = ciNormalizeWorkspaceRelativePath(change.path);
      if (seenPaths.has(relativePath)) {
        throw ciTransactionError(
          `Resource file transaction contains a duplicate path: ${relativePath}`,
          "CI_RESOURCE_FILE_DUPLICATE_PATH",
        );
      }
      seenPaths.add(relativePath);

      const isDelete = change.delete === true;
      const hasContent = Object.hasOwn(change, "content");
      if (isDelete === hasContent) {
        throw ciTransactionError(
          `Resource file change must specify exactly one of content or delete: ${relativePath}`,
          "CI_RESOURCE_FILE_INVALID_CHANGE",
        );
      }

      if (isDelete && Object.hasOwn(change, "mode")) {
        throw ciTransactionError(
          `A deleted resource file cannot specify a mode: ${relativePath}`,
          "CI_RESOURCE_FILE_INVALID_CHANGE",
        );
      }

      return isDelete
        ? { operation: "delete", relativePath }
        : {
            bytes: ciContentToBuffer(change.content),
            mode: change.mode,
            operation: "write",
            relativePath,
          };
    })
    .sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

async function ciSyncDirectory(directoryPath) {
  let directoryHandle;
  try {
    directoryHandle = await open(directoryPath, constants.O_RDONLY);
    await directoryHandle.sync();
  } catch (error) {
    if (!["EISDIR", "EINVAL", "ENOTSUP", "EPERM"].includes(error?.code)) {
      throw error;
    }
  } finally {
    await directoryHandle?.close();
  }
}

async function ciWriteTemporaryFile(targetPath, bytes, mode) {
  const temporaryPath = path.join(
    path.dirname(targetPath),
    `.${path.basename(targetPath)}.ci-${randomUUID()}.tmp`,
  );
  let fileHandle;

  try {
    fileHandle = await open(temporaryPath, "wx", mode);
    await fileHandle.writeFile(bytes);
    await fileHandle.chmod(mode);
    await fileHandle.sync();
    await fileHandle.close();
    fileHandle = undefined;
    return temporaryPath;
  } catch (error) {
    await fileHandle?.close();
    await unlink(temporaryPath).catch(() => undefined);
    throw error;
  }
}

async function ciAtomicWriteAbsoluteFile(targetPath, bytes, mode, { replace }) {
  const temporaryPath = await ciWriteTemporaryFile(targetPath, bytes, mode);
  let committed = false;

  try {
    if (replace) {
      await rename(temporaryPath, targetPath);
    } else {
      await link(temporaryPath, targetPath);
      await unlink(temporaryPath);
    }
    committed = true;
    await ciSyncDirectory(path.dirname(targetPath));
  } finally {
    if (!committed) await unlink(temporaryPath).catch(() => undefined);
  }
}

async function ciEnsureSafeDirectoryPath(
  applicationRoot,
  relativeDirectoryPath,
  mode,
) {
  const normalized = ciNormalizeWorkspaceRelativePath(relativeDirectoryPath, {
    internal: true,
  });
  let currentPath = applicationRoot;

  for (const segment of normalized.split("/")) {
    const parentPath = currentPath;
    currentPath = path.join(currentPath, segment);
    try {
      const stats = await lstat(currentPath);
      if (stats.isSymbolicLink() || !stats.isDirectory()) {
        throw ciTransactionError(
          `Resource transaction directory is unsafe: ${currentPath}`,
          "CI_RESOURCE_FILE_SYMLINK_PATH",
        );
      }
    } catch (error) {
      if (!ciIsMissingError(error)) throw error;
      try {
        await mkdir(currentPath, { mode });
        await chmod(currentPath, mode);
        await ciSyncDirectory(parentPath);
      } catch (mkdirError) {
        if (mkdirError?.code !== "EEXIST") throw mkdirError;
        const stats = await lstat(currentPath);
        if (stats.isSymbolicLink() || !stats.isDirectory()) {
          throw ciTransactionError(
            `Resource transaction directory is unsafe: ${currentPath}`,
            "CI_RESOURCE_FILE_SYMLINK_PATH",
          );
        }
      }
    }
  }

  return currentPath;
}

function ciTransactionRelativeDirectory(transactionId) {
  return `${CI_RESOURCE_FILE_TRANSACTION_ROOT}/${transactionId}`;
}

function ciTransactionJournalRelativePath(transactionId) {
  return `${ciTransactionRelativeDirectory(transactionId)}/transaction.json`;
}

async function ciWriteJournal(applicationRoot, journal) {
  journal.updatedAt = new Date().toISOString();
  const relativePath = ciTransactionJournalRelativePath(journal.transactionId);
  const inspection = await ciInspectSafeWorkspacePath(
    applicationRoot,
    relativePath,
  );
  const bytes = Buffer.from(`${JSON.stringify(journal, null, 2)}\n`, "utf8");
  await ciAtomicWriteAbsoluteFile(
    inspection.absolutePath,
    bytes,
    CI_RESOURCE_PRIVATE_FILE_MODE,
    { replace: inspection.targetExists },
  );
}

async function ciWriteBlob(applicationRoot, transactionId, bytes) {
  const sha256 = ciHashBytes(bytes);
  const relativePath = `${ciTransactionRelativeDirectory(transactionId)}/blobs/${sha256}`;
  const inspection = await ciInspectSafeWorkspacePath(
    applicationRoot,
    relativePath,
  );

  if (inspection.targetExists) {
    const existing = await ciReadWorkspaceFileState(
      applicationRoot,
      relativePath,
    );
    if (existing.kind !== "file" || existing.sha256 !== sha256) {
      throw ciTransactionError(
        `Resource transaction blob is corrupt: ${sha256}`,
        "CI_RESOURCE_FILE_CORRUPT_JOURNAL",
      );
    }
    return sha256;
  }

  await ciAtomicWriteAbsoluteFile(
    inspection.absolutePath,
    bytes,
    CI_RESOURCE_PRIVATE_FILE_MODE,
    { replace: false },
  );
  return sha256;
}

async function ciReadBlob(applicationRoot, transactionId, sha256) {
  if (!CI_SHA256_PATTERN.test(sha256)) {
    throw ciTransactionError(
      `Resource transaction contains an invalid blob hash: ${sha256}`,
      "CI_RESOURCE_FILE_CORRUPT_JOURNAL",
    );
  }

  const relativePath = `${ciTransactionRelativeDirectory(transactionId)}/blobs/${sha256}`;
  const state = await ciReadWorkspaceFileState(applicationRoot, relativePath);
  if (state.kind !== "file" || state.sha256 !== sha256) {
    throw ciTransactionError(
      `Resource transaction blob is missing or corrupt: ${sha256}`,
      "CI_RESOURCE_FILE_CORRUPT_JOURNAL",
    );
  }
  return state.bytes;
}

function ciValidateJournalState(state, label) {
  if (!state || typeof state !== "object") {
    throw ciTransactionError(
      `Resource transaction journal has an invalid ${label} state.`,
      "CI_RESOURCE_FILE_CORRUPT_JOURNAL",
    );
  }
  if (state.kind === "absent") return;
  if (
    state.kind !== "file" ||
    !CI_SHA256_PATTERN.test(state.sha256) ||
    !Number.isInteger(state.size) ||
    state.size < 0 ||
    !Number.isInteger(state.mode) ||
    state.mode < 0 ||
    state.mode > CI_RESOURCE_FILE_MODE_MASK
  ) {
    throw ciTransactionError(
      `Resource transaction journal has an invalid ${label} state.`,
      "CI_RESOURCE_FILE_CORRUPT_JOURNAL",
    );
  }
}

function ciValidateJournal(journal, transactionId, applicationRoot) {
  if (
    !journal ||
    typeof journal !== "object" ||
    journal.schemaVersion !== CI_RESOURCE_FILE_TRANSACTION_SCHEMA_VERSION ||
    journal.transactionId !== transactionId ||
    journal.applicationRoot !== applicationRoot ||
    !CI_JOURNAL_STATUSES.has(journal.status) ||
    !Array.isArray(journal.files) ||
    !Array.isArray(journal.plannedCreatedDirectories) ||
    !Array.isArray(journal.createdDirectories)
  ) {
    throw ciTransactionError(
      `Resource transaction journal is invalid: ${transactionId}`,
      "CI_RESOURCE_FILE_CORRUPT_JOURNAL",
    );
  }

  const seenPaths = new Set();
  for (const entry of journal.files) {
    const relativePath = ciNormalizeWorkspaceRelativePath(entry?.path);
    if (relativePath !== entry.path || seenPaths.has(relativePath)) {
      throw ciTransactionError(
        `Resource transaction journal contains an invalid file path: ${String(entry?.path)}`,
        "CI_RESOURCE_FILE_CORRUPT_JOURNAL",
      );
    }
    seenPaths.add(relativePath);
    ciValidateJournalState(entry.before, "before");
    ciValidateJournalState(entry.after, "after");
  }

  const plannedDirectories = new Set();
  for (const directoryPath of journal.plannedCreatedDirectories) {
    const normalized = ciNormalizeWorkspaceRelativePath(directoryPath);
    const ownsDirectory = journal.files.some(
      (entry) =>
        entry.after.kind === "file" && entry.path.startsWith(`${normalized}/`),
    );
    if (
      normalized !== directoryPath ||
      plannedDirectories.has(normalized) ||
      !ownsDirectory
    ) {
      throw ciTransactionError(
        `Resource transaction journal contains an invalid directory path: ${String(directoryPath)}`,
        "CI_RESOURCE_FILE_CORRUPT_JOURNAL",
      );
    }
    plannedDirectories.add(normalized);
  }

  const createdDirectories = new Set();
  for (const directoryPath of journal.createdDirectories) {
    const normalized = ciNormalizeWorkspaceRelativePath(directoryPath);
    if (
      normalized !== directoryPath ||
      createdDirectories.has(normalized) ||
      !plannedDirectories.has(normalized)
    ) {
      throw ciTransactionError(
        `Resource transaction journal contains an invalid created directory path: ${String(directoryPath)}`,
        "CI_RESOURCE_FILE_CORRUPT_JOURNAL",
      );
    }
    createdDirectories.add(normalized);
  }

  return journal;
}

async function ciLoadJournal(applicationRoot, transactionId) {
  const relativePath = ciTransactionJournalRelativePath(transactionId);
  const journalState = await ciReadWorkspaceFileState(
    applicationRoot,
    relativePath,
  );
  if (journalState.kind === "absent") {
    throw ciTransactionError(
      `Resource file transaction does not exist: ${transactionId}`,
      "CI_RESOURCE_FILE_TRANSACTION_NOT_FOUND",
    );
  }

  let journal;
  try {
    journal = JSON.parse(journalState.bytes.toString("utf8"));
  } catch (error) {
    throw ciTransactionError(
      `Resource transaction journal cannot be read: ${transactionId}`,
      "CI_RESOURCE_FILE_CORRUPT_JOURNAL",
      { cause: error },
    );
  }

  return ciValidateJournal(journal, transactionId, applicationRoot);
}

function ciJournalPublicView(applicationRoot, journal) {
  return {
    ...structuredClone(journal),
    journalPath: path.join(
      applicationRoot,
      ...ciTransactionJournalRelativePath(journal.transactionId).split("/"),
    ),
  };
}

function ciBuildConflict(entry, expected, actual) {
  return {
    path: entry.path,
    expected: ciPublicState(expected),
    actual: ciPublicState(actual),
  };
}

async function ciInspectEntries(applicationRoot, journal, expectedKey) {
  const conflicts = [];
  for (const entry of journal.files) {
    const actual = await ciReadWorkspaceFileState(applicationRoot, entry.path);
    if (!ciStatesMatch(actual, entry[expectedKey])) {
      conflicts.push(ciBuildConflict(entry, entry[expectedKey], actual));
    }
  }
  return conflicts;
}

async function ciCreatePlannedDirectories(applicationRoot, journal) {
  const directories = [...journal.plannedCreatedDirectories].sort(
    (left, right) => left.split("/").length - right.split("/").length,
  );

  for (const directoryPath of directories) {
    const absolutePath = ciResolveConfinedAbsolutePath(
      applicationRoot,
      directoryPath,
    );
    const parentRelativePath = directoryPath.split("/").slice(0, -1).join("/");
    if (parentRelativePath) {
      const parentInspection = await ciInspectSafeWorkspacePath(
        applicationRoot,
        `${parentRelativePath}/.ci-directory-probe`,
      );
      if (parentInspection.missingDirectories.length > 0) {
        throw ciTransactionError(
          `Resource transaction parent directory is missing: ${parentRelativePath}`,
          "CI_RESOURCE_FILE_INVALID_PATH",
        );
      }
    }

    try {
      const stats = await lstat(absolutePath);
      if (stats.isSymbolicLink() || !stats.isDirectory()) {
        throw ciTransactionError(
          `Resource transaction directory is unsafe: ${directoryPath}`,
          "CI_RESOURCE_FILE_SYMLINK_PATH",
        );
      }
      continue;
    } catch (error) {
      if (!ciIsMissingError(error)) throw error;
    }

    try {
      await mkdir(absolutePath, { mode: CI_RESOURCE_DIRECTORY_DEFAULT_MODE });
      await chmod(absolutePath, CI_RESOURCE_DIRECTORY_DEFAULT_MODE);
      journal.createdDirectories.push(directoryPath);
      await ciWriteJournal(applicationRoot, journal);
      await ciSyncDirectory(path.dirname(absolutePath));
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
      const stats = await lstat(absolutePath);
      if (stats.isSymbolicLink() || !stats.isDirectory()) {
        throw ciTransactionError(
          `Resource transaction directory is unsafe: ${directoryPath}`,
          "CI_RESOURCE_FILE_SYMLINK_PATH",
        );
      }
    }
  }
}

async function ciAtomicWriteWorkspaceFile(
  applicationRoot,
  relativePath,
  bytes,
  mode,
  expectedCurrent,
) {
  const actual = await ciReadWorkspaceFileState(applicationRoot, relativePath);
  if (!ciStatesMatch(actual, expectedCurrent)) {
    throw ciTransactionError(
      `Resource file changed before it could be written: ${relativePath}`,
      "CI_RESOURCE_FILE_CONCURRENT_CHANGE",
      {
        conflicts: [
          {
            path: relativePath,
            expected: ciPublicState(expectedCurrent),
            actual: ciPublicState(actual),
          },
        ],
      },
    );
  }

  const inspection = await ciInspectSafeWorkspacePath(
    applicationRoot,
    relativePath,
  );
  await ciAtomicWriteAbsoluteFile(inspection.absolutePath, bytes, mode, {
    replace: expectedCurrent.kind === "file",
  });
}

async function ciDeleteWorkspaceFile(
  applicationRoot,
  relativePath,
  expectedCurrent,
) {
  const actual = await ciReadWorkspaceFileState(applicationRoot, relativePath);
  if (!ciStatesMatch(actual, expectedCurrent)) {
    throw ciTransactionError(
      `Resource file changed before it could be deleted: ${relativePath}`,
      "CI_RESOURCE_FILE_CONCURRENT_CHANGE",
      {
        conflicts: [
          {
            path: relativePath,
            expected: ciPublicState(expectedCurrent),
            actual: ciPublicState(actual),
          },
        ],
      },
    );
  }

  if (actual.kind === "file") {
    const inspection = await ciInspectSafeWorkspacePath(
      applicationRoot,
      relativePath,
    );
    await unlink(inspection.absolutePath);
    await ciSyncDirectory(path.dirname(inspection.absolutePath));
  }
}

async function ciRemoveCreatedEmptyDirectories(applicationRoot, journal) {
  const directories = [...new Set(journal.createdDirectories)].sort(
    (left, right) => right.split("/").length - left.split("/").length,
  );

  for (const directoryPath of directories) {
    const absolutePath = ciResolveConfinedAbsolutePath(
      applicationRoot,
      directoryPath,
    );
    try {
      const stats = await lstat(absolutePath);
      if (stats.isSymbolicLink() || !stats.isDirectory()) continue;
      await rmdir(absolutePath);
      await ciSyncDirectory(path.dirname(absolutePath));
    } catch (error) {
      if (!["ENOENT", "ENOTEMPTY", "EEXIST", "ENOTDIR"].includes(error?.code)) {
        throw error;
      }
    }
  }
}

async function ciRollbackJournal(
  applicationRoot,
  journal,
  { allowAlreadyRestored, finalStatus },
) {
  const restoreEntries = [];
  const conflicts = [];

  for (const entry of journal.files) {
    const actual = await ciReadWorkspaceFileState(applicationRoot, entry.path);
    if (ciStatesMatch(actual, entry.after)) {
      restoreEntries.push({ actual, entry });
      continue;
    }
    if (allowAlreadyRestored && ciStatesMatch(actual, entry.before)) continue;
    conflicts.push(ciBuildConflict(entry, entry.after, actual));
  }

  if (conflicts.length > 0) {
    return {
      conflicts,
      status: "conflicted",
    };
  }

  journal.status = "rolling-back";
  await ciWriteJournal(applicationRoot, journal);

  for (const { actual, entry } of restoreEntries) {
    if (entry.before.kind === "absent") {
      await ciDeleteWorkspaceFile(applicationRoot, entry.path, actual);
      continue;
    }

    const bytes = await ciReadBlob(
      applicationRoot,
      journal.transactionId,
      entry.before.sha256,
    );
    await ciAtomicWriteWorkspaceFile(
      applicationRoot,
      entry.path,
      bytes,
      entry.before.mode,
      actual,
    );
  }

  await ciRemoveCreatedEmptyDirectories(applicationRoot, journal);
  const verificationConflicts = await ciInspectEntries(
    applicationRoot,
    journal,
    "before",
  );
  if (verificationConflicts.length > 0) {
    journal.status = "failed-conflicted";
    await ciWriteJournal(applicationRoot, journal);
    throw ciTransactionError(
      `Resource transaction rollback could not restore every before-image: ${journal.transactionId}`,
      "CI_RESOURCE_FILE_ROLLBACK_FAILED",
      { conflicts: verificationConflicts },
    );
  }

  journal.status = finalStatus;
  journal.rolledBackAt = new Date().toISOString();
  await ciWriteJournal(applicationRoot, journal);
  return {
    conflicts: [],
    status: "rolled-back",
  };
}

/**
 * Durably snapshots the exact before- and after-images for a set of resource
 * file changes without mutating any target file.
 */
export async function ciCreateResourceFileTransaction({
  applicationRoot,
  changes,
  metadata,
  transactionId: requestedTransactionId,
}) {
  const resolvedApplicationRoot =
    await ciResolveApplicationRoot(applicationRoot);
  const transactionId = ciNormalizeTransactionId(requestedTransactionId);
  const normalizedChanges = ciNormalizeChanges(changes);
  const preparedEntries = [];
  const plannedCreatedDirectories = new Set();

  for (const change of normalizedChanges) {
    const inspection = await ciInspectSafeWorkspacePath(
      resolvedApplicationRoot,
      change.relativePath,
    );
    const before = await ciReadWorkspaceFileState(
      resolvedApplicationRoot,
      change.relativePath,
    );
    const after =
      change.operation === "delete"
        ? { kind: "absent" }
        : {
            bytes: change.bytes,
            kind: "file",
            mode: ciNormalizeMode(
              change.mode,
              before.kind === "file"
                ? before.mode
                : CI_RESOURCE_FILE_DEFAULT_MODE,
            ),
            sha256: ciHashBytes(change.bytes),
            size: change.bytes.byteLength,
          };

    if (change.operation === "write") {
      for (const directoryPath of inspection.missingDirectories) {
        plannedCreatedDirectories.add(directoryPath);
      }
    }

    preparedEntries.push({
      after,
      before,
      path: change.relativePath,
    });
  }

  await ciEnsureSafeDirectoryPath(
    resolvedApplicationRoot,
    CI_RESOURCE_FILE_TRANSACTION_ROOT,
    CI_RESOURCE_PRIVATE_DIRECTORY_MODE,
  );
  const transactionRelativeDirectory =
    ciTransactionRelativeDirectory(transactionId);
  const transactionDirectory = ciResolveConfinedAbsolutePath(
    resolvedApplicationRoot,
    transactionRelativeDirectory,
  );

  try {
    await mkdir(transactionDirectory, {
      mode: CI_RESOURCE_PRIVATE_DIRECTORY_MODE,
    });
    await chmod(transactionDirectory, CI_RESOURCE_PRIVATE_DIRECTORY_MODE);
    await ciSyncDirectory(path.dirname(transactionDirectory));
  } catch (error) {
    if (error?.code === "EEXIST") {
      throw ciTransactionError(
        `Resource file transaction already exists: ${transactionId}`,
        "CI_RESOURCE_FILE_TRANSACTION_EXISTS",
      );
    }
    throw error;
  }

  try {
    await ciEnsureSafeDirectoryPath(
      resolvedApplicationRoot,
      `${transactionRelativeDirectory}/blobs`,
      CI_RESOURCE_PRIVATE_DIRECTORY_MODE,
    );

    for (const entry of preparedEntries) {
      if (entry.before.kind === "file") {
        await ciWriteBlob(
          resolvedApplicationRoot,
          transactionId,
          entry.before.bytes,
        );
      }
      if (entry.after.kind === "file") {
        await ciWriteBlob(
          resolvedApplicationRoot,
          transactionId,
          entry.after.bytes,
        );
      }
    }

    let normalizedMetadata;
    if (metadata !== undefined) {
      try {
        normalizedMetadata = JSON.parse(JSON.stringify(metadata));
      } catch (error) {
        throw ciTransactionError(
          "Resource file transaction metadata must be JSON-serializable.",
          "CI_RESOURCE_FILE_INVALID_METADATA",
          { cause: error },
        );
      }
    }

    const now = new Date().toISOString();
    const journal = {
      applicationRoot: resolvedApplicationRoot,
      createdAt: now,
      createdDirectories: [],
      files: preparedEntries.map((entry) => ({
        after: ciStateWithoutBytes(entry.after),
        before: ciStateWithoutBytes(entry.before),
        path: entry.path,
      })),
      ...(normalizedMetadata === undefined
        ? {}
        : { metadata: normalizedMetadata }),
      plannedCreatedDirectories: [...plannedCreatedDirectories].sort(),
      schemaVersion: CI_RESOURCE_FILE_TRANSACTION_SCHEMA_VERSION,
      status: "prepared",
      transactionId,
      updatedAt: now,
    };

    await ciWriteJournal(resolvedApplicationRoot, journal);
    return ciJournalPublicView(resolvedApplicationRoot, journal);
  } catch (error) {
    await rm(transactionDirectory, { force: true, recursive: true }).catch(
      () => undefined,
    );
    throw error;
  }
}

/** Applies a previously prepared transaction if every before-image still matches. */
export async function ciApplyResourceFileTransaction({
  applicationRoot,
  transactionId: requestedTransactionId,
}) {
  const resolvedApplicationRoot =
    await ciResolveApplicationRoot(applicationRoot);
  const transactionId = ciNormalizeTransactionId(requestedTransactionId);
  const journal = await ciLoadJournal(resolvedApplicationRoot, transactionId);

  if (journal.status === "applied") {
    return {
      conflicts: [],
      journal: ciJournalPublicView(resolvedApplicationRoot, journal),
      status: "applied",
    };
  }
  if (journal.status !== "prepared") {
    throw ciTransactionError(
      `Resource file transaction cannot be applied from status ${journal.status}: ${transactionId}`,
      "CI_RESOURCE_FILE_INVALID_TRANSACTION_STATUS",
    );
  }

  const conflicts = await ciInspectEntries(
    resolvedApplicationRoot,
    journal,
    "before",
  );
  if (conflicts.length > 0) {
    return {
      conflicts,
      journal: ciJournalPublicView(resolvedApplicationRoot, journal),
      status: "conflicted",
    };
  }

  journal.status = "applying";
  await ciWriteJournal(resolvedApplicationRoot, journal);

  try {
    await ciCreatePlannedDirectories(resolvedApplicationRoot, journal);

    for (const entry of journal.files) {
      if (entry.after.kind === "absent") {
        await ciDeleteWorkspaceFile(
          resolvedApplicationRoot,
          entry.path,
          entry.before,
        );
        continue;
      }

      const bytes = await ciReadBlob(
        resolvedApplicationRoot,
        transactionId,
        entry.after.sha256,
      );
      await ciAtomicWriteWorkspaceFile(
        resolvedApplicationRoot,
        entry.path,
        bytes,
        entry.after.mode,
        entry.before,
      );
    }

    const verificationConflicts = await ciInspectEntries(
      resolvedApplicationRoot,
      journal,
      "after",
    );
    if (verificationConflicts.length > 0) {
      throw ciTransactionError(
        `Resource transaction did not produce every expected after-image: ${transactionId}`,
        "CI_RESOURCE_FILE_APPLY_FAILED",
        { conflicts: verificationConflicts },
      );
    }

    journal.appliedAt = new Date().toISOString();
    journal.status = "applied";
    await ciWriteJournal(resolvedApplicationRoot, journal);
    return {
      conflicts: [],
      journal: ciJournalPublicView(resolvedApplicationRoot, journal),
      status: "applied",
    };
  } catch (error) {
    const recovery = await ciRollbackJournal(resolvedApplicationRoot, journal, {
      allowAlreadyRestored: true,
      finalStatus: "failed-rolled-back",
    }).catch((rollbackError) => ({
      conflicts: rollbackError.conflicts ?? [],
      error: rollbackError,
      status: "conflicted",
    }));

    if (recovery.status === "conflicted") {
      journal.status = "failed-conflicted";
      await ciWriteJournal(resolvedApplicationRoot, journal).catch(
        () => undefined,
      );
    }

    throw ciTransactionError(
      recovery.status === "rolled-back"
        ? `Resource transaction apply failed and its before-images were restored: ${transactionId}`
        : `Resource transaction apply failed and requires conflict resolution: ${transactionId}`,
      "CI_RESOURCE_FILE_APPLY_FAILED",
      {
        cause: error,
        conflicts: recovery.conflicts,
      },
    );
  }
}

/** Prepares and applies a resource file transaction in one call. */
export async function ciRunResourceFileTransaction(input) {
  const journal = await ciCreateResourceFileTransaction(input);
  return ciApplyResourceFileTransaction({
    applicationRoot: input.applicationRoot,
    transactionId: journal.transactionId,
  });
}

/**
 * Restores every before-image only after all current files match their expected
 * after-images. Conflicts are reported before any target file is mutated.
 */
export async function ciRollbackResourceFileTransaction({
  applicationRoot,
  transactionId: requestedTransactionId,
}) {
  const resolvedApplicationRoot =
    await ciResolveApplicationRoot(applicationRoot);
  const transactionId = ciNormalizeTransactionId(requestedTransactionId);
  const journal = await ciLoadJournal(resolvedApplicationRoot, transactionId);

  if (
    journal.status === "rolled-back" ||
    journal.status === "failed-rolled-back"
  ) {
    return {
      conflicts: [],
      journal: ciJournalPublicView(resolvedApplicationRoot, journal),
      status: "rolled-back",
    };
  }

  const resumableStatuses = new Set([
    "applying",
    "rolling-back",
    "failed-conflicted",
  ]);
  if (journal.status !== "applied" && !resumableStatuses.has(journal.status)) {
    throw ciTransactionError(
      `Resource file transaction cannot be rolled back from status ${journal.status}: ${transactionId}`,
      "CI_RESOURCE_FILE_INVALID_TRANSACTION_STATUS",
    );
  }

  const result = await ciRollbackJournal(resolvedApplicationRoot, journal, {
    allowAlreadyRestored: resumableStatuses.has(journal.status),
    finalStatus: "rolled-back",
  });

  return {
    ...result,
    journal: ciJournalPublicView(resolvedApplicationRoot, journal),
  };
}

/** Reads and validates a transaction journal without mutating application files. */
export async function ciReadResourceFileTransaction({
  applicationRoot,
  transactionId: requestedTransactionId,
}) {
  const resolvedApplicationRoot =
    await ciResolveApplicationRoot(applicationRoot);
  const transactionId = ciNormalizeTransactionId(requestedTransactionId);
  const journal = await ciLoadJournal(resolvedApplicationRoot, transactionId);
  return ciJournalPublicView(resolvedApplicationRoot, journal);
}
