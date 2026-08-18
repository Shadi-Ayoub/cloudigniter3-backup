import assert from "node:assert/strict";
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { ciCreateResourceStudioLocalStore } from "../src/runtime/resource-studio/ci-resource-studio-local-store.mjs";
import { ciStartResourceStudioServer } from "../src/runtime/resource-studio/ci-resource-studio-server.mjs";
import { ciCreateResourceStudioService } from "../src/runtime/resource-studio/ci-resource-studio-service.mjs";

async function ciPathExists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function ciE2ePlanners() {
  const normalize = (value) => ({
    ...value,
    schemaVersion: 1,
    kind: "data-entity",
    provider: "aws-amplify",
    dataStore: {
      mode: "managed-model",
      modelName: value.name,
      identifier: ["PK", "SK"],
    },
    authorization: value.authorization ?? [],
    secondaryIndexes: value.secondaryIndexes ?? [],
  });
  return {
    core: { ciCoreRoutes: {} },
    aws: {
      CI_AWS_RESOURCE_STUDIO_CAPABILITIES: {
        fieldTypes: [{ id: "String" }],
        authorizationStrategies: ["groups"],
      },
      ciNormalizeAwsDataEntityDescriptor: normalize,
      ciPlanAwsDataEntities({ descriptors }) {
        const entities = descriptors.map(normalize);
        return {
          descriptors: entities,
          warnings: [],
          frontend: entities,
          files: [
            ...entities.flatMap((entity) => {
              const root = `amplify/custom/data/schemata/data-entities/${entity.id}`;
              return [
                {
                  path: `${root}/entity.ci.json`,
                  content: `${JSON.stringify(entity, null, 2)}\n`,
                  ownership: "generated",
                  resourceId: entity.id,
                },
                {
                  path: `${root}/schema.generated.ts`,
                  content: `export const model = ${JSON.stringify(entity.name)};\n`,
                  ownership: "generated",
                  resourceId: entity.id,
                },
              ];
            }),
            {
              path: "amplify/custom/data/schemata/registry.generated.ts",
              content: `export const entities = ${JSON.stringify(entities.map((entity) => entity.id))};\n`,
              ownership: "generated",
            },
          ],
        };
      },
    },
    next: {
      ciPlanNextDataEntities({ entities }) {
        return {
          files: [
            ...entities.map((entity) => ({
              path: `src/app/(ci-${entity.scope})/ci-${entity.scope}/(ci-custom)${entity.managementPage.path}/page.tsx`,
              content: `export default function Page() { return ${JSON.stringify(entity.name)}; }\n`,
              ownership: "generated",
              resourceId: entity.id,
            })),
            {
              path: "src/custom/routes/resource-studio.generated.ts",
              content: `export const routes = ${JSON.stringify(entities.map((entity) => entity.managementPage.path))};\n`,
              ownership: "generated",
            },
          ],
        };
      },
    },
  };
}

async function ciAuthenticate(studio, bootstrapToken) {
  const response = await fetch(`${studio.origin}/api/session`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${bootstrapToken}`,
      origin: studio.origin,
    },
  });
  assert.equal(response.status, 200);
  return {
    cookie: response.headers.get("set-cookie").split(";")[0],
    ...(await response.json()),
  };
}

test("serves a loopback-only token session and protects every API mutation", async (t) => {
  const calls = [];
  const service = {
    async getState() {
      return { entities: [], capabilities: {}, history: [] };
    },
    async createEntity(value) {
      calls.push(["create", value]);
      return { status: "applied", transactionId: "tx-create" };
    },
    async updateEntity() {
      throw new Error("not used");
    },
    async dropEntity() {
      throw new Error("not used");
    },
    async undo() {
      throw new Error("not used");
    },
    async getDeploymentPlanHash() {
      return "b".repeat(64);
    },
  };
  const awsRuntime = {
    async getSettings() {
      return { schemaVersion: 1, sandboxIdentifier: "ci-rs-test" };
    },
    async preflight(value) {
      calls.push(["preflight", value]);
      return {
        account: "123456789012",
        arn: "arn:aws:sts::123456789012:assumed-role/Developer/person",
        region: "eu-west-1",
        ...value,
      };
    },
    async ssoLogin() {
      throw new Error("not used");
    },
    async deploy() {
      throw new Error("not used");
    },
  };
  const localStore = {
    async readLogs() {
      return [];
    },
  };
  const studio = await ciStartResourceStudioServer({
    service,
    awsRuntime,
    localStore,
    bootstrapToken: "test-bootstrap-token",
  });
  t.after(() => studio.close());

  assert.equal(new URL(studio.url).hash, "#token=test-bootstrap-token");
  const unauthorized = await fetch(`${studio.origin}/api/state`);
  assert.equal(unauthorized.status, 401);

  const wrong = await fetch(`${studio.origin}/api/session`, {
    method: "POST",
    headers: {
      authorization: "Bearer wrong",
      origin: studio.origin,
    },
  });
  assert.equal(wrong.status, 401);

  const sessionResponse = await fetch(`${studio.origin}/api/session`, {
    method: "POST",
    headers: {
      authorization: "Bearer test-bootstrap-token",
      origin: studio.origin,
    },
  });
  assert.equal(sessionResponse.status, 200);
  const session = await sessionResponse.json();
  const cookie = sessionResponse.headers.get("set-cookie").split(";")[0];
  assert.ok(session.csrf);
  assert.doesNotMatch(JSON.stringify(session), /test-bootstrap-token/);

  const reused = await fetch(`${studio.origin}/api/session`, {
    method: "POST",
    headers: {
      authorization: "Bearer test-bootstrap-token",
      origin: studio.origin,
    },
  });
  assert.equal(reused.status, 401);

  const stateResponse = await fetch(`${studio.origin}/api/state`, {
    headers: { cookie },
  });
  assert.equal(stateResponse.status, 200);
  assert.deepEqual((await stateResponse.json()).entities, []);

  const noCsrf = await fetch(`${studio.origin}/api/entities`, {
    method: "POST",
    headers: {
      cookie,
      "content-type": "application/json",
      origin: studio.origin,
    },
    body: JSON.stringify({ id: "book" }),
  });
  assert.equal(noCsrf.status, 403);
  assert.equal(calls.length, 0);

  const created = await fetch(`${studio.origin}/api/entities`, {
    method: "POST",
    headers: {
      cookie,
      "content-type": "application/json",
      origin: studio.origin,
      "x-ci-csrf": session.csrf,
    },
    body: JSON.stringify({ id: "book" }),
  });
  assert.equal(created.status, 201);
  assert.deepEqual(calls, [["create", { id: "book" }]]);

  const preflight = await fetch(`${studio.origin}/api/aws/preflight`, {
    method: "POST",
    headers: {
      cookie,
      "content-type": "application/json",
      origin: studio.origin,
      "x-ci-csrf": session.csrf,
    },
    body: JSON.stringify({ profile: "developer-sso", identifier: "ci-books" }),
  });
  assert.equal(preflight.status, 200);
  assert.deepEqual(calls.at(-1), [
    "preflight",
    {
      profile: "developer-sso",
      identifier: "ci-books",
      planHash: "b".repeat(64),
    },
  ]);

  const asset = await fetch(`${studio.origin}/studio.js`);
  assert.equal(asset.status, 200);
  assert.match(
    asset.headers.get("content-security-policy"),
    /script-src 'self'/,
  );
  assert.doesNotMatch(await asset.text(), /test-bootstrap-token/);
});

test("expires bootstrap tokens and authenticated sessions", async (t) => {
  let currentTime = Date.parse("2026-08-16T00:00:00.000Z");
  const service = {
    async getState() {
      return { entities: [], capabilities: {}, history: [] };
    },
  };
  const awsRuntime = {
    async getSettings() {
      return { schemaVersion: 1, sandboxIdentifier: "ci-rs-test" };
    },
  };
  const localStore = {
    async readLogs() {
      return [];
    },
  };

  const expiredBootstrap = await ciStartResourceStudioServer({
    service,
    awsRuntime,
    localStore,
    bootstrapToken: "expiring-bootstrap",
    bootstrapTtlMs: 100,
    sessionTtlMs: 100,
    now: () => currentTime,
  });
  t.after(() => expiredBootstrap.close());
  currentTime += 100;
  const bootstrapResponse = await fetch(
    `${expiredBootstrap.origin}/api/session`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer expiring-bootstrap",
        origin: expiredBootstrap.origin,
      },
    },
  );
  assert.equal(bootstrapResponse.status, 401);

  currentTime += 1;
  const expiringSession = await ciStartResourceStudioServer({
    service,
    awsRuntime,
    localStore,
    bootstrapToken: "session-bootstrap",
    bootstrapTtlMs: 100,
    sessionTtlMs: 100,
    now: () => currentTime,
  });
  t.after(() => expiringSession.close());
  const session = await ciAuthenticate(expiringSession, "session-bootstrap");
  currentTime += 100;
  const stateResponse = await fetch(`${expiringSession.origin}/api/state`, {
    headers: { cookie: session.cookie },
  });
  assert.equal(stateResponse.status, 401);
});

test("offline API create and undo restore the exact pre-create workspace", async (t) => {
  const applicationRoot = await mkdtemp(
    path.join(os.tmpdir(), "ci-resource-studio-e2e-"),
  );
  t.after(() => rm(applicationRoot, { recursive: true, force: true }));
  const planners = ciE2ePlanners();
  const emptyAwsPlan = planners.aws.ciPlanAwsDataEntities({ descriptors: [] });
  const emptyNextPlan = planners.next.ciPlanNextDataEntities({
    entities: emptyAwsPlan.frontend,
  });
  for (const file of [...emptyAwsPlan.files, ...emptyNextPlan.files]) {
    const target = path.join(applicationRoot, ...file.path.split("/"));
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, file.content);
  }
  const registryPath = path.join(
    applicationRoot,
    "amplify/custom/data/schemata/registry.generated.ts",
  );
  const routesPath = path.join(
    applicationRoot,
    "src/custom/routes/resource-studio.generated.ts",
  );
  const registryBefore = await readFile(registryPath);
  const routesBefore = await readFile(routesPath);
  await writeFile(
    path.join(applicationRoot, "developer-notes.txt"),
    "leave me alone\n",
  );

  const localStore = await ciCreateResourceStudioLocalStore({
    applicationRoot,
  });
  const service = await ciCreateResourceStudioService({
    applicationRoot,
    loadPlanners: async () => planners,
    inspectReservations: async () => ({ routePaths: [], modelNames: [] }),
  });
  const awsRuntime = {
    async getSettings() {
      return {
        ...(await localStore.readSettings()),
        nodeRuntime: {
          version: "22.0.0",
          major: 22,
          supported: true,
          supportedMajors: [22, 24],
        },
      };
    },
  };
  const bootstrapToken = "offline-e2e-token";
  const studio = await ciStartResourceStudioServer({
    service,
    awsRuntime,
    localStore,
    bootstrapToken,
  });
  t.after(() => studio.close());
  const session = await ciAuthenticate(studio, bootstrapToken);
  const requestHeaders = {
    cookie: session.cookie,
    "content-type": "application/json",
    origin: studio.origin,
    "x-ci-csrf": session.csrf,
  };

  const descriptor = {
    id: "book",
    name: "Book",
    pluralName: "Books",
    scope: "tenant",
    description: "Manage books.",
    managementPage: { path: "/dashboard/books", title: "Manage Books" },
    fields: [
      {
        name: "title",
        label: "Title",
        type: "String",
        required: true,
        array: false,
        itemsRequired: false,
      },
    ],
    authorization: [],
    secondaryIndexes: [],
  };
  const createResponse = await fetch(`${studio.origin}/api/entities`, {
    method: "POST",
    headers: requestHeaders,
    body: JSON.stringify(descriptor),
  });
  assert.equal(createResponse.status, 201);
  const created = await createResponse.json();
  const descriptorPath = path.join(
    applicationRoot,
    "amplify/custom/data/schemata/data-entities/book/entity.ci.json",
  );
  assert.equal(await ciPathExists(descriptorPath), true);

  const undoResponse = await fetch(`${studio.origin}/api/undo`, {
    method: "POST",
    headers: requestHeaders,
    body: JSON.stringify({ transactionId: created.transactionId }),
  });
  assert.equal(undoResponse.status, 200);
  assert.equal((await undoResponse.json()).status, "rolled-back");
  assert.equal(await ciPathExists(descriptorPath), false);
  assert.deepEqual(await readFile(registryPath), registryBefore);
  assert.deepEqual(await readFile(routesPath), routesBefore);
  assert.equal(
    await readFile(path.join(applicationRoot, "developer-notes.txt"), "utf8"),
    "leave me alone\n",
  );
});
