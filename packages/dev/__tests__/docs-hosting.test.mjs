import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fixture } from "./fixtures.mjs";
import { mkdir, writeFile, readFile, symlink } from "node:fs/promises";
import {
  ciCreateDocsManifest,
  ciDocsHostingPolicy,
  ciVerifyDocsSite,
  ciVerifyDocsDistribution,
  ciVerifyDocsBucketProtection,
  ciVerifyDocsAuthPolicies,
} from "../src/ci/docs-site.mjs";
import { ciValidateRepositories } from "../src/repository-config.mjs";
import { ciScaffoldBuildRepository } from "../src/build-repositories.mjs";

test("Docs scaffolding selects protected delivery rather than the public website uploader", async (t) => {
  const { root, json } = await fixture(t);
  await json(".cloudigniter/repositories.json", {
    schemaVersion: 1,
    baseBranch: "main",
    projects: {
      "cloudigniter-docs": {
        type: "website",
        sourcePath: "docs",
        sourceRepository: "company/docs",
        buildRepository: "company/build-docs",
        buildVisibility: "private",
        delivery: "aws",
      },
    },
  });
  const result = await ciScaffoldBuildRepository(
    root,
    "cloudigniter-docs",
    root + "-docs-build",
    "static",
  );
  t.after(async () =>
    (await import("node:fs/promises")).rm(result.output, {
      recursive: true,
      force: true,
    }),
  );
  assert.equal(result.access, "cloudigniter-developer");
  const workflow = await readFile(
    path.join(result.output, ".github/workflows/deploy-aws.yml"),
    "utf8",
  );
  assert.ok(workflow.indexOf("--hosting") < workflow.indexOf("aws s3 sync"));
  assert.ok(
    workflow.includes(
      'site/developer/ "s3://$DEVELOPER_SITE_BUCKET/developers/"',
    ),
  );
});

async function artifact(t) {
  const { root } = await fixture(t);
  const site = path.join(root, "site");
  for (const edition of ["public", "developer"]) {
    await mkdir(path.join(site, edition), { recursive: true });
    await writeFile(
      path.join(site, edition, "index.html"),
      `${edition} content`,
    );
  }
  const manifest = await ciCreateDocsManifest(site, {
    policy: ciDocsHostingPolicy,
    sourceCommit: "a".repeat(40),
    sourceDirty: false,
  });
  await writeFile(path.join(site, "manifest.json"), JSON.stringify(manifest));
  return { site, manifest };
}
test("reviewed Docs manifest binds both editions and rejects changed, extra or symlinked files", async (t) => {
  for (const change of ["changed", "extra", "symlink"]) {
    const { site } = await artifact(t);
    assert.equal(
      (await ciVerifyDocsSite(site)).kind,
      "cloudigniter-docs-static",
    );
    if (change === "changed")
      await writeFile(
        path.join(site, "developer/index.html"),
        "altered internal content",
      );
    if (change === "extra")
      await writeFile(path.join(site, "public/extra.html"), "unreviewed");
    if (change === "symlink")
      await symlink(
        path.join(site, "developer/index.html"),
        path.join(site, "public/alias.html"),
      );
    await assert.rejects(ciVerifyDocsSite(site), /differs|symlinks/);
  }
});
test("dirty builds, combined previews and weaker access policies cannot deploy", async (t) => {
  const { site, manifest } = await artifact(t);
  manifest.sourceDirty = true;
  await writeFile(path.join(site, "manifest.json"), JSON.stringify(manifest));
  await assert.rejects(ciVerifyDocsSite(site), /committed/);
  await assert.doesNotReject(ciVerifyDocsSite(site, false));
  await assert.rejects(
    ciCreateDocsManifest(site, {
      sourceCommit: "a".repeat(40),
      sourceDirty: false,
      policy: { ...ciDocsHostingPolicy, requiredRole: "admin" },
    }),
    /developer authorization/,
  );
  await mkdir(path.join(site, "public/company-developers"));
  await writeFile(
    path.join(site, "public/company-developers/index.html"),
    "private",
  );
  await assert.rejects(
    ciCreateDocsManifest(site, {
      sourceCommit: "a".repeat(40),
      sourceDirty: false,
      policy: ciDocsHostingPolicy,
    }),
    /public output/,
  );
});

test("internal publishing images cannot be delivered through shared public static assets", async (t) => {
  const { site } = await artifact(t);
  await mkdir(path.join(site, "public/img/publishing"), { recursive: true });
  await writeFile(
    path.join(site, "public/img/publishing/internal-diagram.png"),
    "internal diagram bytes",
  );
  await assert.rejects(
    ciCreateDocsManifest(site, {
      sourceCommit: "a".repeat(40),
      sourceDirty: false,
      policy: ciDocsHostingPolicy,
    }),
    /public output/,
  );
});

const settings = {
  publicBucket: "docs-public",
  developerBucket: "docs-developer",
  keyGroup: "group-123",
  authOrigin: "website-runtime.example.com",
};
function distribution() {
  return {
    Distribution: {
      Status: "Deployed",
      ARN: "arn:aws:cloudfront::123456789012:distribution/ABC",
      DistributionConfig: {
        Enabled: true,
        Aliases: { Items: ["docs.cloudigniter.io"] },
        Origins: {
          Items: [
            {
              Id: "public",
              DomainName: "docs-public.s3.us-east-1.amazonaws.com",
              OriginAccessControlId: "oac-public",
              OriginPath: "",
            },
            {
              Id: "developer",
              DomainName: "docs-developer.s3.us-east-1.amazonaws.com",
              OriginAccessControlId: "oac-dev",
              OriginPath: "",
            },
            {
              Id: "auth",
              DomainName: settings.authOrigin,
              CustomOriginConfig: { OriginProtocolPolicy: "https-only" },
            },
          ],
        },
        DefaultCacheBehavior: { TargetOriginId: "public" },
        CacheBehaviors: {
          Items: [
            {
              PathPattern: "/developers*",
              TargetOriginId: "developer",
              TrustedKeyGroups: {
                Enabled: true,
                Quantity: 1,
                Items: [settings.keyGroup],
              },
              AllowedMethods: { Items: ["GET", "HEAD"] },
              ViewerProtocolPolicy: "https-only",
            },
            {
              PathPattern: "/auth/docs/*",
              TargetOriginId: "auth",
              ViewerProtocolPolicy: "https-only",
            },
          ],
        },
      },
    },
  };
}
test("Docs CloudFront contract allows only isolated, signed-cookie protected delivery with the website auth origin", () => {
  assert.equal(
    ciVerifyDocsDistribution(distribution(), settings),
    "arn:aws:cloudfront::123456789012:distribution/ABC",
  );
  for (const mutate of [
    (config) => {
      config.CacheBehaviors.Items[0].TrustedKeyGroups.Enabled = false;
    },
    (config) => {
      config.CacheBehaviors.Items[0].TrustedKeyGroups.Items = ["other-key"];
    },
    (config) => {
      config.CacheBehaviors.Items[0].AllowedMethods.Items.push("OPTIONS");
    },
    (config) => {
      config.CacheBehaviors.Items[0].ViewerProtocolPolicy = "allow-all";
    },
    (config) => {
      config.DefaultCacheBehavior.TargetOriginId = "developer";
    },
    (config) => {
      config.CacheBehaviors.Items.push({
        PathPattern: "/developers/assets/*",
        TargetOriginId: "public",
      });
    },
    (config) => {
      config.Origins.Items[1].OriginAccessControlId = "";
    },
    (config) => {
      config.Origins.Items[1].DomainName =
        "docs-developer.s3-website-us-east-1.amazonaws.com";
    },
    (config) => {
      config.Origins.Items[2].DomainName = "unrelated.example.com";
    },
  ]) {
    const value = distribution();
    mutate(value.Distribution.DistributionConfig);
    assert.throws(() => ciVerifyDocsDistribution(value, settings));
  }
  assert.throws(() =>
    ciVerifyDocsDistribution(distribution(), {
      ...settings,
      developerBucket: settings.publicBucket,
    }),
  );
});
test("Docs bucket exposure and cached or incomplete auth forwarding fail closed", () => {
  const block = {
    PublicAccessBlockConfiguration: {
      BlockPublicAcls: true,
      IgnorePublicAcls: true,
      BlockPublicPolicy: true,
      RestrictPublicBuckets: true,
    },
  };
  ciVerifyDocsBucketProtection(block);
  for (const key of Object.keys(block.PublicAccessBlockConfiguration)) {
    assert.throws(() =>
      ciVerifyDocsBucketProtection({
        PublicAccessBlockConfiguration: {
          ...block.PublicAccessBlockConfiguration,
          [key]: false,
        },
      }),
    );
  }
  const cache = {
    CachePolicy: { CachePolicyConfig: { MinTTL: 0, DefaultTTL: 0, MaxTTL: 0 } },
  };
  const request = {
    OriginRequestPolicy: {
      OriginRequestPolicyConfig: {
        CookiesConfig: { CookieBehavior: "all" },
        QueryStringsConfig: { QueryStringBehavior: "all" },
      },
    },
  };
  ciVerifyDocsAuthPolicies(cache, request);
  assert.throws(() =>
    ciVerifyDocsAuthPolicies(
      {
        CachePolicy: {
          CachePolicyConfig: { MinTTL: 1, DefaultTTL: 0, MaxTTL: 0 },
        },
      },
      request,
    ),
  );
  assert.throws(() =>
    ciVerifyDocsAuthPolicies(cache, {
      OriginRequestPolicy: {
        OriginRequestPolicyConfig: {
          CookiesConfig: { CookieBehavior: "none" },
          QueryStringsConfig: { QueryStringBehavior: "all" },
        },
      },
    }),
  );
});
test("repository inventory cannot downgrade Docs to public-only website delivery", () => {
  assert.throws(
    () =>
      ciValidateRepositories({
        schemaVersion: 1,
        baseBranch: "main",
        projects: {
          "cloudigniter-docs": {
            type: "website",
            sourcePath: "docs",
            sourceRepository: "company/docs",
            buildRepository: "company/build-docs",
            buildVisibility: "private",
            delivery: "aws",
            staticAccess: "public",
          },
        },
      }),
    /unrestricted/,
  );
});
