import { constants } from "node:fs";
import { chmod, lstat, mkdir, open, rename, unlink } from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { stripVTControlCharacters } from "node:util";

const CI_LOCAL_ROOT = ".cloudigniter/local";
const CI_STUDIO_ROOT = `${CI_LOCAL_ROOT}/resource-studio`;
const CI_SETTINGS_PATH = `${CI_STUDIO_ROOT}/settings.json`;
const CI_LOG_PATH = `${CI_STUDIO_ROOT}/lifecycle.jsonl`;
const CI_IGNORE_PATH = `${CI_LOCAL_ROOT}/.gitignore`;
const CI_IDENTIFIER_PATTERN = /^[A-Za-z0-9-]{1,15}$/;
const CI_PEM_BEGIN_PATTERN = /-----BEGIN ([A-Z0-9][A-Z0-9 -]{0,63})-----/i;
const CI_PEM_BLOCK_PATTERN =
  /-----BEGIN ([A-Z0-9][A-Z0-9 -]{0,63})-----[\s\S]*?(?:-----END \1-----|$)/gi;
const CI_SENSITIVE_ASSIGNMENT_PATTERN =
  /(["']?)(\b[A-Za-z0-9_.-]*(?:access[_-]?key[_-]?id|secret[_-]?access[_-]?key|client[_-]?secret|private[_-]?key|api[_-]?key|token|secret|password|credentials?|authorization)\b)\1(\s*[:=]\s*)(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^\s,;]+)/gi;

function ciIsMissing(error) {
  return error?.code === "ENOENT";
}

async function ciEnsurePrivateDirectory(applicationRoot, relativePath) {
  let current = applicationRoot;
  for (const segment of relativePath.split("/")) {
    current = path.join(current, segment);
    try {
      const stats = await lstat(current);
      if (stats.isSymbolicLink() || !stats.isDirectory()) {
        throw new Error(
          `Resource Studio local state path is unsafe: ${current}`,
        );
      }
    } catch (error) {
      if (!ciIsMissing(error)) throw error;
      await mkdir(current, { mode: 0o700 });
      await chmod(current, 0o700);
    }
  }
  return current;
}

async function ciReadPrivateFile(applicationRoot, relativePath) {
  await ciEnsurePrivateDirectory(
    applicationRoot,
    path.posix.dirname(relativePath),
  );
  const absolutePath = path.join(applicationRoot, ...relativePath.split("/"));
  let stats;
  try {
    stats = await lstat(absolutePath);
  } catch (error) {
    if (ciIsMissing(error)) return undefined;
    throw error;
  }
  if (stats.isSymbolicLink() || !stats.isFile()) {
    throw new Error(
      `Resource Studio local state file is unsafe: ${absolutePath}`,
    );
  }
  const handle = await open(
    absolutePath,
    constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
  );
  try {
    return await handle.readFile();
  } finally {
    await handle.close();
  }
}

async function ciAtomicPrivateWrite(applicationRoot, relativePath, content) {
  const directory = path.posix.dirname(relativePath);
  await ciEnsurePrivateDirectory(applicationRoot, directory);
  const absolutePath = path.join(applicationRoot, ...relativePath.split("/"));
  const temporaryPath = path.join(
    path.dirname(absolutePath),
    `.${path.basename(absolutePath)}.${randomUUID()}.tmp`,
  );
  const handle = await open(temporaryPath, "wx", 0o600);
  try {
    await handle.writeFile(content);
    await handle.chmod(0o600);
    await handle.sync();
  } finally {
    await handle.close();
  }
  try {
    try {
      const targetStats = await lstat(absolutePath);
      if (targetStats.isSymbolicLink() || !targetStats.isFile()) {
        throw new Error(
          `Resource Studio local state file is unsafe: ${absolutePath}`,
        );
      }
    } catch (error) {
      if (!ciIsMissing(error)) throw error;
    }
    await rename(temporaryPath, absolutePath);
  } catch (error) {
    await unlink(temporaryPath).catch(() => undefined);
    throw error;
  }
}

function ciValidateProfile(profile, { required = false } = {}) {
  if (profile === undefined || profile === null || profile === "") {
    if (required) {
      const error = new Error("Select an explicit AWS profile first.");
      error.code = "CI_RESOURCE_STUDIO_PROFILE_REQUIRED";
      error.statusCode = 400;
      throw error;
    }
    return undefined;
  }
  if (
    typeof profile !== "string" ||
    profile.trim() !== profile ||
    profile.length > 128 ||
    /[\u0000-\u001f\u007f]/.test(profile)
  ) {
    const error = new Error("AWS profile names must be plain, non-empty text.");
    error.code = "CI_RESOURCE_STUDIO_INVALID_PROFILE";
    error.statusCode = 400;
    throw error;
  }
  return profile;
}

export function ciValidateResourceStudioIdentifier(identifier) {
  if (
    typeof identifier !== "string" ||
    !CI_IDENTIFIER_PATTERN.test(identifier)
  ) {
    const error = new Error(
      "The Amplify sandbox identifier must use 1-15 letters, numbers, or hyphens.",
    );
    error.code = "CI_RESOURCE_STUDIO_INVALID_IDENTIFIER";
    error.statusCode = 400;
    throw error;
  }
  return identifier;
}

function ciDefaultIdentifier(applicationRoot) {
  const digest = createHash("sha256")
    .update(applicationRoot)
    .digest("hex")
    .slice(0, 8);
  return `ci-rs-${digest}`;
}

export function ciRedactResourceStudioLogString(value) {
  return stripVTControlCharacters(String(value))
    .replace(CI_PEM_BLOCK_PATTERN, "[REDACTED_PEM_BLOCK]")
    .replace(
      /\b(Authorization\s*:\s*)(?:Bearer|Basic)\s+[^\s,;]+/gi,
      "$1[REDACTED]",
    )
    .replace(/\b(Bearer|Basic)\s+[^\s,;]+/gi, "$1 [REDACTED]")
    .replace(CI_SENSITIVE_ASSIGNMENT_PATTERN, "$1$2$1$3[REDACTED]")
    .replace(/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g, "[REDACTED_AWS_ACCESS_KEY]")
    .replace(
      /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
      "[REDACTED_JWT]",
    );
}

function ciSanitizeResourceStudioStreamLine(line, state) {
  let remaining = stripVTControlCharacters(String(line));
  let sanitized = "";

  while (remaining !== "") {
    if (state.pemLabel) {
      const endMarker = `-----END ${state.pemLabel}-----`;
      const endIndex = remaining.toUpperCase().indexOf(endMarker);
      if (endIndex < 0) return sanitized;
      state.pemLabel = undefined;
      remaining = remaining.slice(endIndex + endMarker.length);
      continue;
    }

    const beginMatch = CI_PEM_BEGIN_PATTERN.exec(remaining);
    if (!beginMatch) {
      sanitized += ciRedactResourceStudioLogString(remaining);
      break;
    }

    sanitized += ciRedactResourceStudioLogString(
      remaining.slice(0, beginMatch.index),
    );
    sanitized += "[REDACTED_PEM_BLOCK]";
    const pemLabel = beginMatch[1].toUpperCase();
    const afterBegin = remaining.slice(beginMatch.index + beginMatch[0].length);
    const endMarker = `-----END ${pemLabel}-----`;
    const endIndex = afterBegin.toUpperCase().indexOf(endMarker);
    if (endIndex < 0) {
      state.pemLabel = pemLabel;
      return sanitized;
    }
    remaining = afterBegin.slice(endIndex + endMarker.length);
  }

  return sanitized;
}

export function ciCreateResourceStudioLogStreamSanitizer() {
  let pendingOutput = "";
  const state = { pemLabel: undefined };

  const sanitizeLines = (lines) =>
    lines
      .map((line) => ciSanitizeResourceStudioStreamLine(line, state))
      .filter(Boolean);

  return {
    push(chunk) {
      pendingOutput += String(chunk);
      const lines = pendingOutput.split(/[\r\n]+/);
      pendingOutput = lines.pop() ?? "";
      return sanitizeLines(lines);
    },

    flush() {
      const lines = pendingOutput === "" ? [] : sanitizeLines([pendingOutput]);
      pendingOutput = "";
      return lines;
    },
  };
}

function ciSanitizeLogValue(value, depth = 0) {
  if (depth > 3) return "[truncated]";
  if (Array.isArray(value))
    return value
      .slice(0, 50)
      .map((item) => ciSanitizeLogValue(item, depth + 1));
  if (!value || typeof value !== "object") {
    return typeof value === "string"
      ? ciRedactResourceStudioLogString(value).slice(0, 4_000)
      : value;
  }
  return Object.fromEntries(
    Object.entries(value)
      .filter(
        ([key]) =>
          !/token|secret|password|credentials?|api.?key|access.?key|private.?key|authorization/i.test(
            key,
          ),
      )
      .map(([key, item]) => [key, ciSanitizeLogValue(item, depth + 1)]),
  );
}

export async function ciCreateResourceStudioLocalStore({ applicationRoot }) {
  await ciEnsurePrivateDirectory(applicationRoot, CI_STUDIO_ROOT);
  const ignoreBytes = await ciReadPrivateFile(applicationRoot, CI_IGNORE_PATH);
  const ignoreText = ignoreBytes?.toString("utf8") ?? "";
  if (!ignoreText.split(/\r?\n/).includes("*")) {
    // This directory-level rule keeps every machine-local journal, setting, and
    // log out of Git without requiring a mutation to the application's root ignore file.
    const separator =
      ignoreText === "" || ignoreText.endsWith("\n") ? "" : "\n";
    await ciAtomicPrivateWrite(
      applicationRoot,
      CI_IGNORE_PATH,
      `${ignoreText}${separator}*\n`,
    );
  }

  const readSettings = async () => {
    const bytes = await ciReadPrivateFile(applicationRoot, CI_SETTINGS_PATH);
    if (!bytes) {
      return {
        schemaVersion: 1,
        profile: undefined,
        sandboxIdentifier: ciDefaultIdentifier(applicationRoot),
      };
    }
    let value;
    try {
      value = JSON.parse(bytes.toString("utf8"));
    } catch (error) {
      throw new Error("Resource Studio local settings contain invalid JSON.", {
        cause: error,
      });
    }
    if (!value || value.schemaVersion !== 1) {
      throw new Error(
        "Resource Studio local settings use an unsupported schema.",
      );
    }
    return {
      schemaVersion: 1,
      profile: ciValidateProfile(value.profile),
      sandboxIdentifier: ciValidateResourceStudioIdentifier(
        value.sandboxIdentifier ?? ciDefaultIdentifier(applicationRoot),
      ),
    };
  };

  const writeSettings = async (settings) => {
    const value = {
      schemaVersion: 1,
      ...(ciValidateProfile(settings.profile)
        ? { profile: settings.profile }
        : {}),
      sandboxIdentifier: ciValidateResourceStudioIdentifier(
        settings.sandboxIdentifier,
      ),
    };
    await ciAtomicPrivateWrite(
      applicationRoot,
      CI_SETTINGS_PATH,
      `${JSON.stringify(value, null, 2)}\n`,
    );
    return value;
  };

  const updateSettings = async (patch) => {
    const current = await readSettings();
    return writeSettings({ ...current, ...patch });
  };

  const appendLog = async (event) => {
    const line = `${JSON.stringify({
      timestamp: new Date().toISOString(),
      ...ciSanitizeLogValue(event),
    })}\n`;
    const absolutePath = path.join(applicationRoot, ...CI_LOG_PATH.split("/"));
    let existing;
    try {
      existing = await lstat(absolutePath);
    } catch (error) {
      if (!ciIsMissing(error)) throw error;
    }
    if (existing?.isSymbolicLink() || (existing && !existing.isFile())) {
      throw new Error(`Resource Studio log path is unsafe: ${absolutePath}`);
    }
    const handle = await open(
      absolutePath,
      constants.O_APPEND |
        constants.O_CREAT |
        constants.O_WRONLY |
        (constants.O_NOFOLLOW ?? 0),
      0o600,
    );
    try {
      await handle.writeFile(line);
      await handle.sync();
    } finally {
      await handle.close();
    }
  };

  const readLogs = async ({ limit = 200 } = {}) => {
    const bytes = await ciReadPrivateFile(applicationRoot, CI_LOG_PATH);
    if (!bytes) return [];
    return bytes
      .toString("utf8")
      .split("\n")
      .filter(Boolean)
      .slice(-Math.max(1, Math.min(1_000, limit)))
      .flatMap((line) => {
        try {
          return [JSON.parse(line)];
        } catch {
          return [];
        }
      });
  };

  const initial = await readSettings();
  await writeSettings(initial);
  return {
    readSettings,
    updateSettings,
    appendLog,
    readLogs,
    requireProfile: (profile) => ciValidateProfile(profile, { required: true }),
  };
}
