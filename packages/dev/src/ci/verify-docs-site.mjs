import { execFileSync } from "node:child_process";
import {
  ciVerifyDocsSite,
  ciVerifyDocsDistribution,
  ciVerifyDocsBucketProtection,
  ciVerifyDocsAuthPolicies,
} from "./docs-site.mjs";

if (
  process.argv.length !== 3 ||
  !["--files", "--hosting"].includes(process.argv[2])
) {
  throw new Error(
    "Use verify-docs-site.mjs --files or --hosting from the build repository root.",
  );
}
await ciVerifyDocsSite("site");
if (process.argv[2] === "--hosting") {
  const settings = {
    publicBucket: process.env.PUBLIC_SITE_BUCKET ?? "",
    developerBucket: process.env.DEVELOPER_SITE_BUCKET ?? "",
    keyGroup: process.env.DOCS_TRUSTED_KEY_GROUP_ID ?? "",
    authOrigin: process.env.DOCS_AUTH_ORIGIN ?? "",
  };
  const distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID ?? "";
  if (
    !/^[A-Z0-9]+$/.test(distributionId) ||
    !/^[a-z0-9.-]+$/.test(settings.authOrigin) ||
    [settings.publicBucket, settings.developerBucket].some(
      (bucket) => !/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket),
    )
  ) {
    throw new Error(
      "Configure exact Docs distribution, bucket names and CloudIgniter auth origin.",
    );
  }
  /** @param {string[]} args */
  const aws = (args) =>
    JSON.parse(
      execFileSync("aws", [...args, "--output", "json", "--no-cli-pager"], {
        encoding: "utf8",
      }),
    );
  const distribution = aws([
    "cloudfront",
    "get-distribution",
    "--id",
    distributionId,
  ]);
  ciVerifyDocsDistribution(distribution, settings);
  const auth =
    distribution.Distribution.DistributionConfig.CacheBehaviors.Items.find(
      /** @param {{PathPattern: string}} item */ (item) =>
        item.PathPattern === "/auth/docs/*",
    );
  if (!auth?.CachePolicyId || !auth.OriginRequestPolicyId)
    throw new Error(
      "Docs authentication requires explicit cache and origin-request policies.",
    );
  ciVerifyDocsAuthPolicies(
    aws(["cloudfront", "get-cache-policy", "--id", auth.CachePolicyId]),
    aws([
      "cloudfront",
      "get-origin-request-policy",
      "--id",
      auth.OriginRequestPolicyId,
    ]),
  );
  for (const bucket of [settings.publicBucket, settings.developerBucket]) {
    ciVerifyDocsBucketProtection(
      aws(["s3api", "get-public-access-block", "--bucket", bucket]),
    );
    if (
      aws(["s3api", "get-bucket-policy-status", "--bucket", bucket])
        .PolicyStatus?.IsPublic !== false
    ) {
      throw new Error("Docs bucket policy must not allow public access.");
    }
  }
  for (const origin of distribution.Distribution.DistributionConfig.Origins
    .Items) {
    if (!origin.OriginAccessControlId) continue;
    const control = aws([
      "cloudfront",
      "get-origin-access-control",
      "--id",
      origin.OriginAccessControlId,
    ]);
    const config = control.OriginAccessControl?.OriginAccessControlConfig;
    if (
      config?.SigningBehavior !== "always" ||
      config?.SigningProtocol !== "sigv4"
    )
      throw new Error("Docs S3 origins require always-signed OAC.");
  }
}
