import { createHash } from "node:crypto";
import { readdir, readFile, lstat } from "node:fs/promises";
import path from "node:path";

export const ciDocsHostingPolicy = Object.freeze({
  schemaVersion: 1,
  url: "https://docs.cloudigniter.io",
  publicBaseUrl: "/",
  developerBaseUrl: "/developers/",
  authentication: "cloudigniter-template",
  authorization: "emberguard",
  requiredRole: "developer",
  resource: "documentation.company",
  action: "read",
  sessionMaxAgeSeconds: 300,
});

/** @param {unknown} value @returns {Record<string, unknown>} */
function record(value) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid Docs hosting record.");
  return /** @type {Record<string, unknown>} */ (value);
}

/** The role gate is a reviewed delivery contract, never an editable browser claim.
 * @param {unknown} policy
 */
export function ciValidateDocsHostingPolicy(policy) {
  const value = record(policy);
  if (
    Object.keys(value).length !== Object.keys(ciDocsHostingPolicy).length ||
    Object.entries(ciDocsHostingPolicy).some(
      ([key, expected]) => value[key] !== expected,
    )
  ) {
    throw new Error(
      "Docs require CloudIgniter template authentication and EmberGuard developer authorization.",
    );
  }
}

/** @param {string} root */
export async function ciDocsFiles(root) {
  /** @type {{path: string, sha256: string}[]} */
  const files = [];
  /** @param {string} directory @param {string} prefix */
  async function visit(directory, prefix) {
    const stat = await lstat(directory);
    if (!stat.isDirectory() || stat.isSymbolicLink())
      throw new Error("Docs output must contain real directories.");
    for (const name of (await readdir(directory)).sort()) {
      if (name.startsWith("._") || /[\\\x00-\x1f]/.test(name))
        throw new Error("Invalid Docs output path.");
      const absolute = path.join(directory, name);
      const relative = prefix + name;
      const entry = await lstat(absolute);
      if (entry.isSymbolicLink())
        throw new Error("Docs output cannot contain symlinks.");
      if (entry.isDirectory()) await visit(absolute, relative + "/");
      else if (entry.isFile())
        files.push({
          path: relative,
          sha256: createHash("sha256")
            .update(await readFile(absolute))
            .digest("hex"),
        });
      else throw new Error("Docs output must contain regular files.");
    }
  }
  await visit(root, "");
  return files;
}

/** @param {string} site @param {{sourceCommit: string, sourceDirty: boolean, policy: unknown}} inputs */
export async function ciCreateDocsManifest(site, inputs) {
  ciValidateDocsHostingPolicy(inputs.policy);
  const publicFiles = await ciDocsFiles(path.join(site, "public"));
  const developerFiles = await ciDocsFiles(path.join(site, "developer"));
  for (const files of [publicFiles, developerFiles]) {
    if (!files.some((file) => file.path === "index.html"))
      throw new Error("Both Docs editions require index.html.");
  }
  // Guard accidental plugin/route inclusion. The bundler additionally removes
  // private MDX/catalog imports and page-date metadata from the public graph.
  if (
    publicFiles.some((file) =>
      /^(?:developers|company-developers|developer-dictionary|skills|commands\/dev|img\/publishing)(?:\/|$)/.test(
        file.path,
      ),
    )
  ) {
    throw new Error("Company documentation appeared in public output.");
  }
  return {
    schemaVersion: 1,
    kind: "cloudigniter-docs-static",
    sourceCommit: inputs.sourceCommit,
    sourceDirty: inputs.sourceDirty,
    policy: ciDocsHostingPolicy,
    editions: { public: publicFiles, developer: developerFiles },
  };
}

/** Recompute every byte inventory and reject extra files or a combined preview.
 * @param {string} site @param {boolean} [production]
 */
export async function ciVerifyDocsSite(site, production = true) {
  const manifestPath = path.join(site, "manifest.json");
  if (
    !(await lstat(manifestPath)).isFile() ||
    (await lstat(manifestPath)).isSymbolicLink()
  )
    throw new Error("Docs manifest must be a regular file.");
  const manifest = record(JSON.parse(await readFile(manifestPath, "utf8")));
  if (
    manifest.schemaVersion !== 1 ||
    manifest.kind !== "cloudigniter-docs-static" ||
    typeof manifest.sourceCommit !== "string" ||
    !/^[a-f0-9]{40}$/.test(manifest.sourceCommit) ||
    typeof manifest.sourceDirty !== "boolean" ||
    (production && manifest.sourceDirty)
  ) {
    throw new Error(
      "Docs deployment requires a committed, separated static build.",
    );
  }
  const rebuilt = await ciCreateDocsManifest(site, {
    sourceCommit: manifest.sourceCommit,
    sourceDirty: manifest.sourceDirty,
    policy: manifest.policy,
  });
  if (JSON.stringify(manifest) !== JSON.stringify(rebuilt))
    throw new Error(
      "Docs output or its access policy differs from the reviewed manifest.",
    );
  const roots = await readdir(site);
  if (
    roots.length !== 3 ||
    roots.some(
      (name) => !["public", "developer", "manifest.json"].includes(name),
    )
  ) {
    throw new Error(
      "Docs site must contain only public/, developer/ and manifest.json.",
    );
  }
  return rebuilt;
}

/** Verify actual CloudFront settings before uploading any developer bytes.
 * @param {unknown} raw @param {{publicBucket: string, developerBucket: string, keyGroup: string, authOrigin: string}} settings
 */
export function ciVerifyDocsDistribution(raw, settings) {
  const distribution = record(record(raw).Distribution);
  const config = record(distribution.DistributionConfig);
  const aliases = record(config.Aliases).Items;
  const origins = record(config.Origins).Items;
  const behaviors = record(config.CacheBehaviors).Items;
  if (
    distribution.Status !== "Deployed" ||
    config.Enabled !== true ||
    !Array.isArray(aliases) ||
    !aliases.includes("docs.cloudigniter.io") ||
    !Array.isArray(origins) ||
    !Array.isArray(behaviors) ||
    !settings.keyGroup ||
    !settings.publicBucket ||
    !settings.developerBucket ||
    settings.publicBucket === settings.developerBucket
  ) {
    throw new Error(
      "Docs require deployed CloudFront, the Docs hostname, separate private buckets and a trusted key group.",
    );
  }
  const protectedBehavior = behaviors
    .map(record)
    .filter((item) => item.PathPattern === "/developers*");
  if (protectedBehavior.length !== 1)
    throw new Error(
      "Protect every /developers* URL, including assets, with one explicit CloudFront behavior.",
    );
  const protectedRoute = protectedBehavior[0];
  const keyGroups = record(protectedRoute.TrustedKeyGroups);
  const methods = record(protectedRoute.AllowedMethods).Items;
  if (
    keyGroups.Enabled !== true ||
    keyGroups.Quantity !== 1 ||
    !Array.isArray(keyGroups.Items) ||
    keyGroups.Items.length !== 1 ||
    keyGroups.Items[0] !== settings.keyGroup ||
    !Array.isArray(methods) ||
    methods.length !== 2 ||
    !methods.includes("GET") ||
    !methods.includes("HEAD") ||
    protectedRoute.ViewerProtocolPolicy !== "https-only"
  ) {
    throw new Error(
      "Developer Docs require HTTPS, GET/HEAD only and the configured signed-cookie key group.",
    );
  }
  // Only the sign-in/session callback may use the website's runtime origin.
  // No earlier, more specific behavior may route developer assets around the gate.
  const authBehaviors = behaviors
    .map(record)
    .filter((item) => item.PathPattern === "/auth/docs/*");
  if (behaviors.length !== 2 || authBehaviors.length !== 1)
    throw new Error(
      "Docs require protected /developers* and CloudIgniter /auth/docs/* behaviors only.",
    );
  const authRoute = authBehaviors[0];
  const authOrigin = origins
    .map(record)
    .find((item) => item.Id === authRoute.TargetOriginId);
  if (
    !settings.authOrigin ||
    !authOrigin ||
    authOrigin.DomainName !== settings.authOrigin ||
    !authOrigin.CustomOriginConfig ||
    record(authOrigin.CustomOriginConfig).OriginProtocolPolicy !==
      "https-only" ||
    authRoute.ViewerProtocolPolicy !== "https-only" ||
    authRoute.TargetOriginId === protectedRoute.TargetOriginId
  ) {
    throw new Error(
      "Docs sign-in must use the configured CloudIgniter website runtime over HTTPS.",
    );
  }
  const defaultRoute = record(config.DefaultCacheBehavior);
  if (defaultRoute.TargetOriginId === protectedRoute.TargetOriginId)
    throw new Error("Public and developer origins must be different.");
  if (
    defaultRoute.TargetOriginId === authRoute.TargetOriginId ||
    origins.length !== 3
  )
    throw new Error(
      "Docs public, developer and authentication origins must be separate.",
    );
  /** @type {[Record<string, unknown>, string][]} */
  const staticOrigins = [
    [defaultRoute, settings.publicBucket],
    [protectedRoute, settings.developerBucket],
  ];
  for (const [route, bucket] of staticOrigins) {
    const origin = origins
      .map(record)
      .find((item) => item.Id === route.TargetOriginId);
    if (
      !origin ||
      typeof origin.DomainName !== "string" ||
      origin.DomainName.includes(".s3-website") ||
      !new RegExp(
        `^${bucket.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.s3(?:[.-][a-z0-9-]+)?\\.amazonaws\\.com$`,
      ).test(origin.DomainName) ||
      !origin.OriginAccessControlId ||
      origin.CustomOriginConfig ||
      origin.OriginPath
    ) {
      throw new Error(
        "Docs origins must be the configured S3 buckets with OAC and no alternate origin path.",
      );
    }
  }
  if (typeof distribution.ARN !== "string")
    throw new Error("Missing CloudFront distribution identity.");
  return distribution.ARN;
}

/** @param {unknown} raw */
export function ciVerifyDocsBucketProtection(raw) {
  const block = record(record(raw).PublicAccessBlockConfiguration);
  if (
    [
      "BlockPublicAcls",
      "IgnorePublicAcls",
      "BlockPublicPolicy",
      "RestrictPublicBuckets",
    ].some((key) => block[key] !== true)
  ) {
    throw new Error(
      "Both Docs buckets require all S3 public-access protections.",
    );
  }
}

/** The auth callback forwards authoritative session inputs and must never cache grants.
 * @param {unknown} rawCache @param {unknown} rawRequest
 */
export function ciVerifyDocsAuthPolicies(rawCache, rawRequest) {
  const cache = record(record(rawCache).CachePolicy).CachePolicyConfig;
  const config = record(cache);
  if (["MinTTL", "DefaultTTL", "MaxTTL"].some((field) => config[field] !== 0))
    throw new Error(
      "Docs authentication responses must disable CloudFront caching.",
    );
  const request = record(
    record(rawRequest).OriginRequestPolicy,
  ).OriginRequestPolicyConfig;
  const requestConfig = record(request);
  if (
    record(requestConfig.CookiesConfig).CookieBehavior !== "all" ||
    record(requestConfig.QueryStringsConfig).QueryStringBehavior !== "all"
  ) {
    throw new Error(
      "Docs authentication must forward session cookies and callback query parameters.",
    );
  }
}
