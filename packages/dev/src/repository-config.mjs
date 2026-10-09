/** @param {unknown} value @returns {value is Record<string, unknown>} */
export function ciIsRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** @typedef {{type: 'package'|'website'|'template', package?: string, sourcePath: string|null, sourceRepository: string|null, buildRepository: string, buildVisibility: 'public'|'private', delivery: 'npm'|'aws'|'github', staticAccess?: 'public'|'cloudigniter-developer'}} CiRepositoryProject */

/** @param {unknown} raw */
export function ciValidateRepositories(raw) {
  if (
    !ciIsRecord(raw) ||
    raw.schemaVersion !== 1 ||
    !ciIsRecord(raw.projects) ||
    Object.keys(raw).some(
      (key) => !["schemaVersion", "baseBranch", "projects"].includes(key),
    ) ||
    typeof raw.baseBranch !== "string" ||
    !/^[a-z0-9][a-z0-9._/-]*$/i.test(raw.baseBranch) ||
    /\.\.|\/\/|\.lock(?:\/|$)|[/.]$/.test(raw.baseBranch)
  )
    throw new Error("Invalid company repository configuration.");
  /** @type {Record<string, CiRepositoryProject>} */
  const projects = {};
  const repositories = new Set();
  const packages = new Set();
  for (const [id, item] of Object.entries(raw.projects)) {
    if (
      !/^[a-z][a-z0-9-]*$/.test(id) ||
      !ciIsRecord(item) ||
      Object.keys(item).some(
        (key) =>
          ![
            "type",
            "package",
            "sourcePath",
            "sourceRepository",
            "buildRepository",
            "buildVisibility",
            "delivery",
            "staticAccess",
          ].includes(key),
      ) ||
      !["package", "website", "template"].includes(String(item.type))
    )
      throw new Error(
        "Invalid project entry; credentials do not belong in repository configuration.",
      );
    for (const field of ["sourceRepository", "buildRepository"]) {
      const repository = item[field];
      if (field === "sourceRepository" && repository === null) continue;
      if (
        typeof repository !== "string" ||
        !/^[a-z0-9][a-z0-9-]*\/[a-z0-9][a-z0-9._-]*$/i.test(repository) ||
        repositories.has(repository.toLowerCase())
      )
        throw new Error(
          "Every source and build repository must have a distinct owner/name; one repository cannot be both private source and public export.",
        );
      repositories.add(repository.toLowerCase());
    }
    if (
      item.sourcePath !== null &&
      (typeof item.sourcePath !== "string" ||
        item.sourcePath.includes("\\") ||
        item.sourcePath
          .split("/")
          .some(
            (part) =>
              !part ||
              part === "." ||
              part === ".." ||
              part.startsWith(".") ||
              /[\x00-\x1f]/.test(part),
          ))
    )
      throw new Error(
        "sourcePath must be a confined workspace-relative path or null.",
      );
    if (item.type === "package") {
      if (
        typeof item.package !== "string" ||
        !/^@cloudigniter\/[a-z0-9][a-z0-9-]*$/.test(item.package) ||
        packages.has(item.package) ||
        item.delivery !== "npm" ||
        item.buildVisibility !== "private"
      )
        throw new Error(
          "Package projects require a unique npm package, private build repository and npm delivery.",
        );
      packages.add(item.package);
    } else if (
      item.package !== undefined ||
      (item.type === "website" &&
        (item.delivery !== "aws" || item.buildVisibility !== "private")) ||
      (item.type === "template" &&
        (item.delivery !== "github" || item.buildVisibility !== "public"))
    )
      throw new Error(
        "Website and template delivery/visibility settings are inconsistent.",
      );
    if (item.staticAccess !== undefined && (item.type !== "website" || !["public", "cloudigniter-developer"].includes(String(item.staticAccess)))) {
      throw new Error("staticAccess must select public or CloudIgniter developer-gated website delivery.");
    }
    if (id === "cloudigniter-docs" && item.staticAccess === "public") throw new Error("CloudIgniter Docs cannot use unrestricted website delivery.");
    // Values above are validated together; construct the discriminants explicitly.
    projects[id] = {
      type:
        item.type === "package"
          ? "package"
          : item.type === "website"
            ? "website"
            : "template",
      ...(typeof item.package === "string" ? { package: item.package } : {}),
      sourcePath: typeof item.sourcePath === "string" ? item.sourcePath : null,
      sourceRepository:
        typeof item.sourceRepository === "string"
          ? item.sourceRepository
          : null,
      buildRepository: String(item.buildRepository),
      ...(item.staticAccess === "public" || item.staticAccess === "cloudigniter-developer" ? { staticAccess: item.staticAccess } : {}),
      buildVisibility: item.buildVisibility === "public" ? "public" : "private",
      delivery:
        item.delivery === "npm"
          ? "npm"
          : item.delivery === "aws"
            ? "aws"
            : "github",
    };
  }
  return { schemaVersion: 1, baseBranch: raw.baseBranch, projects };
}
