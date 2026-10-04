import path from "node:path";
import { lstat, readFile, readdir, open } from "node:fs/promises";
import { constants } from "node:fs";
import { createHash } from "node:crypto";
import fg from "fast-glob";
import { getPackages } from "@manypkg/get-packages";
import { parse as parseJsonc } from "jsonc-parser";
import { ciIsRecord, ciReadPolicy } from "./policy.mjs";
import { ciReadRepositories } from "./repositories.mjs";
import { ciReadProfiles, ciProfileSession } from "./github-profiles.mjs";
import { ciRun, CiDevUsageError, ciErrorMessage } from "./runtime.mjs";

/** @param {string} text */
export const ciPublisherHash = (text) =>
  createHash("sha256").update(text).digest("hex");
/** @param {string} value */
export function ciPublisherRelative(value) {
  if (
    !value ||
    path.isAbsolute(value) ||
    value.includes("\\") ||
    /[\x00-\x1f]/.test(value) ||
    value
      .split("/")
      .some(
        (p) =>
          !p || p === ".." || p === "." || p === ".git" || p === "node_modules",
      )
  )
    throw new CiDevUsageError(
      "Expected a confined relative path without traversal.",
    );
  return value;
}
/** Refuse symlinks in every component, including links pointing inside the workspace.
 * @param {string} root @param {string} relative @param {boolean} [missing]
 */
export async function ciPublisherPath(root, relative, missing = false) {
  ciPublisherRelative(relative);
  let current = root;
  for (const part of relative.split("/")) {
    current = path.join(current, part);
    try {
      if ((await lstat(current)).isSymbolicLink())
        throw new CiDevUsageError("Publisher does not follow symbolic links.");
    } catch (error) {
      if (missing && ciIsRecord(error) && error.code === "ENOENT") continue;
      throw error;
    }
  }
  return current;
}
/** @param {string} root @param {string} relative */
async function json(root, relative) {
  return JSON.parse(
    await readFile(await ciPublisherPath(root, relative), "utf8"),
  );
}
/** @param {unknown} value @returns {import('./publisher-types.d.mts').PublisherMetadata} */
export function ciValidatePublisherMetadata(value) {
  const keys = [
    "schemaVersion",
    "label",
    "kind",
    "project",
    "buildDirectories",
    "assets",
    "staticHosting",
    "commands",
  ];
  if (
    !ciIsRecord(value) ||
    value.schemaVersion !== 1 ||
    Object.keys(value).some((k) => !keys.includes(k))
  )
    throw new CiDevUsageError(
      "publisher.config.json requires schemaVersion: 1 and supported fields.",
    );
  for (const k of ["label", "project"])
    if (
      value[k] !== undefined &&
      (typeof value[k] !== "string" || !value[k].trim())
    )
      throw new CiDevUsageError(`Invalid Publisher ${k}.`);
  if (
    value.kind !== undefined &&
    !["package", "app", "template", "website", "docs"].includes(
      String(value.kind),
    )
  )
    throw new CiDevUsageError("Invalid Publisher kind.");
  for (const k of ["assets", "staticHosting"])
    if (value[k] !== undefined && typeof value[k] !== "boolean")
      throw new CiDevUsageError(`Publisher ${k} must be boolean.`);
  if (value.buildDirectories !== undefined) {
    if (
      !Array.isArray(value.buildDirectories) ||
      value.buildDirectories.length > 10
    )
      throw new CiDevUsageError(
        "buildDirectories must be a list of up to 10 relative folders.",
      );
    for (const item of value.buildDirectories) {
      if (typeof item !== "string")
        throw new CiDevUsageError("Invalid build directory.");
      ciPublisherRelative(item);
    }
  }
  const commands =
    /** @type {NonNullable<import('./publisher-types.d.mts').PublisherMetadata['commands']>} */ ({});
  if (value.commands !== undefined) {
    if (!ciIsRecord(value.commands))
      throw new CiDevUsageError("Publisher commands must be an object.");
    for (const [id, cmd] of Object.entries(value.commands)) {
      if (
        !/^[a-z][a-z0-9-]*$/.test(id) ||
        !ciIsRecord(cmd) ||
        Object.keys(cmd).some(
          (k) => !["label", "command", "args"].includes(k),
        ) ||
        typeof cmd.label !== "string" ||
        !["node", "bash", "pnpm"].includes(String(cmd.command)) ||
        !Array.isArray(cmd.args) ||
        !cmd.args.length ||
        !cmd.args.every((a) => typeof a === "string" && !/[\x00-\x1f]/.test(a))
      )
        throw new CiDevUsageError(
          "Invalid explicit Publisher command. Use node/bash with a local script, or pnpm run <script>.",
        );
      if (cmd.command === "pnpm") {
        if (
          cmd.args.length !== 2 ||
          cmd.args[0] !== "run" ||
          !/^[\w:-]+$/.test(cmd.args[1])
        )
          throw new CiDevUsageError(
            "Publisher pnpm commands must select a package script.",
          );
      } else {
        if (cmd.args[0].startsWith("-"))
          throw new CiDevUsageError(
            "Publisher commands require a local script file.",
          );
        ciPublisherRelative(cmd.args[0]);
      }
      commands[id] = {
        label: cmd.label,
        command:
          cmd.command === "node"
            ? "node"
            : cmd.command === "bash"
              ? "bash"
              : "pnpm",
        args: cmd.args,
      };
    }
  }
  return {
    schemaVersion: 1,
    ...(typeof value.label === "string" ? { label: value.label } : {}),
    ...(typeof value.project === "string" ? { project: value.project } : {}),
    ...(value.kind
      ? {
          kind: /** @type {import('./publisher-types.d.mts').PublisherMetadata['kind']} */ (
            value.kind
          ),
        }
      : {}),
    ...(Array.isArray(value.buildDirectories)
      ? {
          buildDirectories: value.buildDirectories.filter(
            (item) => typeof item === "string",
          ),
        }
      : {}),
    ...(typeof value.assets === "boolean" ? { assets: value.assets } : {}),
    ...(typeof value.staticHosting === "boolean"
      ? { staticHosting: value.staticHosting }
      : {}),
    ...(value.commands ? { commands } : {}),
  };
}
/** @param {string} root */
export async function ciPublisherWorkspace(root) {
  /** @type {string[]} */ const warnings = [];
  const repositories = await ciReadRepositories(root).catch((e) => {
    warnings.push(ciErrorMessage(e));
    return null;
  });
  const release = await ciReadPolicy(root).catch((e) => {
    warnings.push(ciErrorMessage(e));
    return null;
  });
  const profiles = await ciReadProfiles(root).catch((e) => {
    warnings.push(ciErrorMessage(e));
    return { profiles: {} };
  });
  const packages = await getPackages(root);
  const directories = new Set(
    packages.packages
      .map((p) => path.relative(root, p.dir).split(path.sep).join("/"))
      .filter(Boolean),
  );
  for (const file of await fg(
    [
      "apps/*/publisher.config.json",
      "packages/*/publisher.config.json",
      "*/publisher.config.json",
    ],
    { cwd: root, followSymbolicLinks: false, ignore: ["node_modules/**"] },
  ))
    directories.add(path.posix.dirname(file));
  for (const project of Object.values(repositories?.projects ?? {}))
    if (project.sourcePath) directories.add(project.sourcePath);
  /** @type {import('./publisher-types.d.mts').PublisherTarget[]} */ const targets =
    [];
  for (const id of [...directories].sort()) {
    try {
      await ciPublisherPath(root, id);
      const manifest = await json(root, `${id}/package.json`).catch(() => null);
      let metadata =
        /** @type {import('./publisher-types.d.mts').PublisherMetadata} */ ({
          schemaVersion: 1,
        });
      const targetWarnings = [];
      try {
        metadata = ciValidatePublisherMetadata(
          await json(root, `${id}/publisher.config.json`),
        );
      } catch (e) {
        if (!(ciIsRecord(e) && e.code === "ENOENT"))
          targetWarnings.push(ciErrorMessage(e));
      }
      if (!manifest && !metadata.label) continue;
      const entry = Object.entries(repositories?.projects ?? {}).find(
        ([key, p]) =>
          metadata.project ? key === metadata.project : p.sourcePath === id,
      );
      if (entry?.[1].sourcePath && entry[1].sourcePath !== id)
        throw new CiDevUsageError(
          `Publisher mapping conflicts with sourcePath for ${id}.`,
        );
      if (metadata.project && !entry)
        targetWarnings.push(`Unknown repository project: ${metadata.project}`);
      const scripts = ciIsRecord(manifest?.scripts)
        ? Object.fromEntries(
            Object.entries(manifest.scripts).filter(
              ([, v]) => typeof v === "string",
            ),
          )
        : {};
      const name = String(
        manifest?.name ?? metadata.label ?? path.basename(id),
      );
      const exports = JSON.stringify(manifest?.exports ?? manifest?.main ?? "");
      targets.push({
        id,
        name,
        label: metadata.label ?? name.replace("@cloudigniter/", ""),
        version: String(manifest?.version ?? "—"),
        description: String(manifest?.description ?? ""),
        kind:
          metadata.kind ??
          entry?.[1].type ??
          (id.startsWith("packages/") ? "package" : "app"),
        private: manifest?.private === true,
        scripts,
        metadata,
        projectId: entry?.[0] ?? null,
        repository: entry?.[1] ?? null,
        access: release?.packages[name]?.access ?? null,
        exportMode: exports.includes("./src/")
          ? "src"
          : exports.includes("./dist/")
            ? "dist"
            : "direct",
        governedBuild: await lstat(
          path.join(root, id, "scripts/ci-build-package.config.mjs"),
        )
          .then((s) => s.isFile() && !s.isSymbolicLink())
          .catch(() => false),
        buildDirectories:
          metadata.buildDirectories ??
          (id === "docs"
            ? ["build"]
            : manifest?.dependencies?.next
              ? [".next"]
              : ["dist"]),
        warnings: targetWarnings,
      });
    } catch (e) {
      warnings.push(`${id}: ${ciErrorMessage(e)}`);
    }
  }
  const git = await Promise.all([
    ciRun("git", ["branch", "--show-current"], root, { timeout: 5000 }).catch(
      () => "",
    ),
    ciRun("git", ["rev-parse", "--short", "HEAD"], root, {
      timeout: 5000,
    }).catch(() => ""),
    ciRun("git", ["status", "--porcelain", "--untracked-files=normal"], root, {
      timeout: 5000,
    }).catch(() => ""),
  ]);
  return {
    root,
    targets: targets.sort((a, b) => a.label.localeCompare(b.label)),
    profiles: profiles.profiles,
    release: release
      ? {
          registry: release.registry,
          reviewers: release.reviewers,
          tags: release.tags,
          baseBranch: release.baseBranch,
          topology: release.topology ?? "monorepo",
        }
      : null,
    git: {
      branch: git[0].trim(),
      commit: git[1].trim(),
      changes: git[2].trim().split("\n").filter(Boolean).length,
    },
    warnings,
  };
}
/** @param {string} root @param {string|undefined} profile @param {import('./types.d.mts').Runner} [run] */
export async function ciPublisherIdentity(root, profile, run = ciRun) {
  const active = await run("gh", ["api", "user", "--jq", ".login"], root, {
    timeout: 10000,
  })
    .then((login) => ({ login: login.trim(), verified: true, error: "" }))
    .catch(() => ({
      login: "",
      verified: false,
      error:
        "Active GitHub account unavailable. Check gh authentication and connectivity.",
    }));
  if (!profile) return { active, selected: { ...active, profile: null } };
  try {
    const session = await ciProfileSession(root, profile, run);
    return {
      active,
      selected: {
        profile,
        login: session.profile?.username ?? "",
        verified: true,
        error: "",
      },
    };
  } catch (e) {
    return {
      active,
      selected: {
        profile,
        login: "",
        verified: false,
        error: ciErrorMessage(e),
      },
    };
  }
}

const globalPatterns = [
  ".changeset/*.{json,md}",
  ".cloudigniter/*.{json,yml,yaml,md,mjs,ts}",
  ".cloudigniter/template/**/*.{json,yml,yaml,md,mjs,ts}",
  ".github/workflows/{dev-quality,next-quality,packages-quality,workspace-quality,source-mirror,npm-stage}.{yml,yaml}",
  ".github/pull_request_template.md",
  ".github/CODEOWNERS",
  "package.json",
  "pnpm-workspace.yaml",
];
const localPatterns = [
  "package.json",
  "publisher.config.json",
  "ci-dev.config.json",
];
const packagePatterns = [
  "tsconfig*.json",
  "tsup.config.{ts,mts,cts,js,mjs,cjs}",
  "rollup.config.{ts,mts,cts,js,mjs,cjs}",
  "obfuscator.config.json",
  ".c8rc.json",
  "coverage-policy.json",
  "scripts/{ci-build-package,ci-switch-sources,entries}.config.{mjs,cjs,js,ts,json}",
];
/** @param {string} root @param {string|undefined} target */
export async function ciPublisherConfigFiles(root, target) {
  let patterns = globalPatterns;
  if (target) {
    const workspace = await ciPublisherWorkspace(root);
    const project = workspace.targets.find((t) => t.id === target);
    if (!project) throw new CiDevUsageError("Unknown Publisher target.");
    patterns = [
      ...localPatterns,
      ...(project.kind === "package" ? packagePatterns : []),
    ].map((p) => `${fg.escapePath(target)}/${p}`);
  }
  const files = await fg(patterns, {
    cwd: root,
    dot: true,
    followSymbolicLinks: false,
    ignore: ["**/node_modules/**", "**/._*"],
  });
  const safe = [];
  for (const file of files.sort()) {
    try {
      await ciPublisherPath(root, file);
      if (!/(?:secret|credential|token|users\.json)/i.test(file))
        safe.push(file);
    } catch {
      /* A linked config is intentionally unavailable. */
    }
  }
  return safe;
}
/** @param {string} root @param {string} file */
async function allowedConfig(root, file) {
  const targets = (await ciPublisherWorkspace(root)).targets;
  const target = targets.find((t) => file.startsWith(`${t.id}/`));
  if (!(await ciPublisherConfigFiles(root, target?.id)).includes(file))
    throw new CiDevUsageError(
      "This file is not an editable Publisher configuration.",
    );
  return ciPublisherPath(root, file);
}
/** @param {string} root @param {string} file */
export async function ciPublisherReadConfig(root, file) {
  const filename = await allowedConfig(root, file);
  if ((await lstat(filename)).size > 1024 * 1024)
    throw new CiDevUsageError("Configuration exceeds 1 MiB.");
  const content = await readFile(filename, "utf8");
  return { file, content, revision: ciPublisherHash(content) };
}
/** @param {string} root @param {string} file @param {string} content @param {string} revision */
export async function ciPublisherSaveConfig(root, file, content, revision) {
  const filename = await allowedConfig(root, file);
  if (Buffer.byteLength(content) > 1024 * 1024)
    throw new CiDevUsageError("Configuration exceeds 1 MiB.");
  if (file.endsWith(".json")) {
    const errors = /** @type {import('jsonc-parser').ParseError[]} */ ([]);
    const parsed = parseJsonc(content, errors, { allowTrailingComma: true });
    if (errors.length)
      throw new CiDevUsageError(
        "Invalid JSON/JSONC. Correct the syntax before saving.",
      );
    if (file.endsWith("publisher.config.json"))
      ciValidatePublisherMetadata(parsed);
    if (!/tsconfig/.test(file)) {
      try {
        JSON.parse(content);
      } catch {
        throw new CiDevUsageError("This configuration requires strict JSON.");
      }
    }
  }
  const handle = await open(filename, constants.O_RDWR | constants.O_NOFOLLOW);
  try {
    const current = await handle.readFile("utf8");
    if (ciPublisherHash(current) !== revision)
      throw new CiDevUsageError(
        "File changed on disk. Reload it before saving; your draft has been preserved.",
      );
    const bytes = Buffer.from(content);
    let offset = 0;
    while (offset < bytes.length) {
      const { bytesWritten } = await handle.write(
        bytes,
        offset,
        bytes.length - offset,
        offset,
      );
      if (!bytesWritten)
        throw new Error("Could not finish writing the configuration.");
      offset += bytesWritten;
    }
    await handle.truncate(Buffer.byteLength(content));
    await handle.sync();
  } finally {
    await handle.close();
  }
  return { file, content, revision: ciPublisherHash(content) };
}
/** @param {string} root @param {string} id */
export async function ciPublisherBuildTree(root, id) {
  const target = (await ciPublisherWorkspace(root)).targets.find(
    (t) => t.id === id,
  );
  if (!target) throw new CiDevUsageError("Unknown Publisher target.");
  /** @type {{path:string,type:string,size?:number,modified?:string}[]} */ const entries =
    [];
  let truncated = false;
  /** @param {string} rel @param {number} depth */
  async function walk(rel, depth) {
    if (entries.length >= 1500 || depth > 12) {
      truncated = true;
      return;
    }
    const full = await ciPublisherPath(root, `${id}/${rel}`);
    const stat = await lstat(full);
    entries.push({
      path: rel,
      type: stat.isDirectory() ? "directory" : "file",
      size: stat.size,
      modified: stat.mtime.toISOString(),
    });
    if (stat.isDirectory())
      for (const item of (await readdir(full)).sort()) {
        if (
          item.startsWith("._") ||
          ["node_modules", ".git", "cache"].includes(item)
        )
          continue;
        if (entries.length >= 1500) {
          truncated = true;
          break;
        }
        try {
          await walk(`${rel}/${item}`, depth + 1);
        } catch (e) {
          if (e instanceof CiDevUsageError)
            entries.push({
              path: `${rel}/${item}`,
              type: "symlink (not followed)",
            });
          else throw e;
        }
      }
  }
  for (const folder of target.buildDirectories) {
    try {
      await walk(folder, 0);
    } catch (e) {
      if (ciIsRecord(e) && e.code === "ENOENT")
        entries.push({ path: folder, type: "not built" });
      else throw e;
    }
  }
  return { target: id, entries, truncated };
}
