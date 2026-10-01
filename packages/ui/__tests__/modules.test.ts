import assert from "node:assert/strict";
import test from "node:test";
import { createElement, type ReactNode } from "react";
import { createRequire } from "node:module";
import { CiModuleManagementPage } from "../src/client/modules/CiModuleManagementPage";
import { CiTodoPage } from "../src/client/modules/CiTodoPage";
import type {
  CiExtensionCatalog,
  CiExtensionInstallation,
} from "@cloudigniter/core/types";
const { renderToStaticMarkup } = createRequire(import.meta.url)(
  "react-dom/server",
) as { renderToStaticMarkup(node: ReactNode): string };
const manifest = {
  schemaVersion: 1,
  kind: "extension",
  id: "todo",
  name: "To-Do List",
  version: "1.0.0",
  runtime: { client: true, server: true },
  target: { framework: "next", clouds: ["aws"] },
} as const;
const denied = async () => ({
  ok: false as const,
  statusCode: 400 as const,
  body: { error: "Denied" },
});
function render(
  status?: CiExtensionInstallation["status"],
  backendAvailable = true,
) {
  const catalog: CiExtensionCatalog = {
    revision: 1,
    entries: [
      {
        manifest,
        detected: true,
        compatible: true,
        backendAvailable,
        ...(status
          ? {
              installation: {
                manifest,
                status,
                operation: "install",
                operationId: "1",
                infrastructure: { provider: "none", id: "todo" },
                configuration: {},
                updatedAt: "2026-09-18T00:00:00.000Z",
                updatedBy: "dev",
              } as CiExtensionInstallation,
            }
          : {}),
      },
    ],
  };
  return renderToStaticMarkup(
    createElement(CiModuleManagementPage, {
      initialCatalog: catalog,
      onReload: denied,
      onCommand: denied,
    }),
  );
}
test("an enabled module must be disabled before the UI exposes uninstall", () => {
  const enabled = render("enabled");
  assert.match(enabled, />Disable</);
  assert.doesNotMatch(enabled, />Uninstall</);
  assert.match(render("disabled"), />Uninstall</);
  assert.match(enabled, /Core modules/);
  assert.match(enabled, /cannot be disabled or uninstalled/);
  assert.match(enabled, />Update</);
});
test("unprovisioned code cannot be installed and initial markup is deterministic", () => {
  const html = render(undefined, false);
  assert.match(html, /<button[^>]*disabled[^>]*>Install<\/button>/);
  assert.equal(html, render(undefined, false));
});
test("task page starts with an accessible loading state without querying during server render", () => {
  const html = renderToStaticMarkup(
    createElement(CiTodoPage, {
      configuration: {},
      execute: async () => {
        throw new Error("Must not execute during SSR");
      },
    }),
  );
  assert.match(html, /aria-busy="true"/);
  assert.match(html, /To-Do/);
});
