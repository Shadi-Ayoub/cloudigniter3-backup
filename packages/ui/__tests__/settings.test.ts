import assert from "node:assert/strict";
import test from "node:test";
import { createElement, type ReactNode } from "react";
import { createRequire } from "node:module";
import {
  ciCreateCoreSettingsRegistry,
  ciCreateSettingsManager,
} from "@cloudigniter/core/lib";
import { CiSettingsManager } from "../src/client/components/settings/CiSettingsManager";
import { ciSettingsForm } from "../src/client/components/settings/ci-settings-form";
import { ciValidateSmartForm } from "../src/lib/smart-form/ci-validate-smart-form";
import type { CiSettingsGroup } from "@cloudigniter/core/types";
import type { CiSettingsStore } from "@cloudigniter/core/types";
const { renderToStaticMarkup } = createRequire(import.meta.url)(
  "react-dom/server",
) as { renderToStaticMarkup(node: ReactNode): string };
const store: CiSettingsStore = {
  async get() {
    return null;
  },
  async set(input) {
    return input;
  },
  async delete() {},
};

test("renders every core category as accessible read-only generated forms", async () => {
  const manager = ciCreateSettingsManager({
    registry: ciCreateCoreSettingsRegistry(),
    store,
    actor: { id: "owner", authenticated: true },
    canManage: () => true,
  });
  for (const scope of ["public", "private", "user"] as const) {
    const groups = await manager.list(scope);
    const render = () =>
      renderToStaticMarkup(
        createElement(CiSettingsManager, {
          title: "Settings",
          groups,
          canUpdate: false,
          onSave: async () => ({ ok: false as const, message: "Denied" }),
        }),
      );
    const html = render();
    assert.equal(html, render());
    assert.match(html, /aria-label="Settings groups"/);
    assert.match(html, /JSON view/);
    assert.doesNotMatch(html, />Edit<|Save changes/);
    assert.match(html, /readonly|disabled/);
  }
});

const formGroups: CiSettingsGroup[] = [
  {
    id: "public.first",
    scope: "public",
    title: "First",
    revision: 4,
    alwaysLoad: false,
    value: {
      title: "First title",
      enabled: true,
      locked: "keep",
      metadata: "preserved",
    },
    fields: [
      { name: "title", required: true },
      { name: "enabled", type: { kind: "boolean" } },
      { name: "locked", readOnly: true },
    ],
  },
  {
    id: "public.second",
    scope: "public",
    title: "Second",
    revision: 2,
    alwaysLoad: false,
    value: { title: "Second title", enabled: true },
    fields: [
      {
        name: "title",
        required: true,
        visibleWhen: { field: "enabled", equals: true },
      },
      { name: "enabled", type: { kind: "boolean" } },
    ],
  },
];

test("one category form preserves independent same-named fields and all section drafts", () => {
  const first = ciSettingsForm(formGroups, true, "public.first");
  const drafts = {
    ...first.data,
    group0Fieldtitle: "Updated first",
    group1Fieldtitle: "Updated second",
    group0Fieldlocked: "tampered",
  };
  const switched = ciSettingsForm(formGroups, true, "public.second");
  assert.deepEqual(switched.updates(drafts), [
    {
      id: "public.first",
      revision: 4,
      value: {
        title: "Updated first",
        enabled: true,
        locked: "keep",
        metadata: "preserved",
      },
    },
    {
      id: "public.second",
      revision: 2,
      value: { title: "Updated second", enabled: true },
    },
  ]);
  assert.equal(
    switched.specifications.fields.find(
      (field) => field.name === "group1Fieldtitle",
    )?.visibleWhen?.field,
    "group1Fieldenabled",
  );
});

test("Save validates inactive sections and identifies which section must be revealed", () => {
  const form = ciSettingsForm(formGroups, true, "public.first");
  const errors = ciValidateSmartForm(form.specifications, {
    ...form.data,
    group1Fieldtitle: "",
  });
  assert.ok(errors.group1Fieldtitle);
  assert.equal(form.invalidGroup(errors), "public.second");
});

test("every section belongs to one form with a single Save and adjacent Close", () => {
  const form = ciSettingsForm(formGroups, true, "public.first");
  const html = renderToStaticMarkup(
    createElement(CiSettingsManager, {
      title: "My Preferences",
      groups: formGroups,
      canUpdate: true,
      onClose() {},
      onSave: async () => ({ ok: true as const, groups: formGroups }),
    }),
  );
  assert.equal((html.match(/<form /g) ?? []).length, 1);
  assert.equal((html.match(/data-smart-button="save"/g) ?? []).length, 1);
  assert.equal((html.match(/data-smart-button="close"/g) ?? []).length, 1);
  assert.match(html, /data-smart-field="group0Fieldtitle"/);
  assert.match(html, /data-smart-field="group1Fieldtitle"/);
  assert.ok(
    html.indexOf('data-smart-button="save"') <
      html.indexOf('data-smart-button="close"'),
  );
  assert.deepEqual(form.data.group0Fieldtitle, "First title");
});

test("authorized settings pages open editable and expose an enabled Save immediately", () => {
  const html = renderToStaticMarkup(
    createElement(CiSettingsManager, {
      title: "Public settings",
      groups: formGroups,
      canUpdate: true,
      onSave: async () => ({ ok: true as const, groups: formGroups }),
    }),
  );
  const titleInput = html.match(/<input[^>]*value="First title"[^>]*>/)?.[0];
  assert.ok(titleInput);
  assert.doesNotMatch(titleInput, /\s(?:readonly|disabled)=/i);
  const save = html.match(/<button[^>]*data-smart-button="save"[^>]*>/)?.[0];
  assert.ok(save);
  assert.doesNotMatch(save, /\sdisabled=/i);
  assert.equal((html.match(/data-smart-button="save"/g) ?? []).length, 1);
  assert.match(html, /JSON view/);
});

test("missing storage disables persistence without hiding Save or preventing authorized draft edits", () => {
  const html = renderToStaticMarkup(
    createElement(CiSettingsManager, {
      title: "My Preferences",
      groups: formGroups,
      canUpdate: true,
      saveUnavailableReason: "Deploy Settings storage before saving.",
      onSave: async () => ({ ok: false as const, message: "Unavailable" }),
      onClose() {},
    }),
  );
  const input = html.match(/<input[^>]*value="First title"[^>]*>/)?.[0];
  assert.ok(input);
  assert.doesNotMatch(input, /\s(?:readonly|disabled)=/i);
  const save = html.match(/<button[^>]*data-smart-button="save"[^>]*>/)?.[0];
  assert.ok(save);
  assert.match(save, /\sdisabled=/i);
  assert.match(html, /Deploy Settings storage before saving/);
  assert.equal((html.match(/data-smart-button="close"/g) ?? []).length, 1);
});

test("read-only permission still prevents editing and does not expose Save", () => {
  const html = renderToStaticMarkup(
    createElement(CiSettingsManager, {
      title: "Private settings",
      groups: formGroups,
      canUpdate: false,
      onSave: async () => ({ ok: false as const, message: "Denied" }),
    }),
  );
  assert.doesNotMatch(html, /data-smart-button="save"/);
  assert.match(
    html.match(/<input[^>]*value="First title"[^>]*>/)?.[0] ?? "",
    /\sreadonly=/i,
  );
});

test("tenant forms mark enforced fields read-only and include the System revision in Save", () => {
  const groups = formGroups.map((group, index) => ({
    ...group,
    systemRevision: 4,
    lockedFields: index === 0 ? ["title"] : [],
  }));
  const form = ciSettingsForm(groups, true, groups[0]!.id);
  assert.equal(
    form.specifications.fields.find(
      (field) => field.name === "group0Fieldtitle",
    )?.readOnly,
    true,
  );
  assert.equal(
    form.specifications.fields.find(
      (field) => field.name === "group1Fieldtitle",
    )?.readOnly,
    false,
  );
  assert.equal(form.updates(form.data)[0]?.systemRevision, 4);
  assert.equal(
    form.updates({ ...form.data, group0Fieldtitle: "replaced" })[0]?.value &&
      (
        form.updates({ ...form.data, group0Fieldtitle: "replaced" })[0]
          ?.value as Record<string, unknown>
      ).title,
    groups[0]!.value.title,
  );
  const optional = ciSettingsForm([{ ...groups[0]!, value: {} }], true);
  assert.equal(
    (
      optional.updates({ group0Fieldtitle: "" })[0]?.value as Record<
        string,
        unknown
      >
    ).title,
    undefined,
  );
});

test("System management exposes scope and rule controls while retaining exactly one category Save", () => {
  const html = renderToStaticMarkup(
    createElement(CiSettingsManager, {
      title: "Public settings",
      groups: formGroups,
      canUpdate: true,
      tenancy: {
        target: { scope: "system" },
        canEnforce: true,
        canOverwrite: true,
        onLoad: async () => ({
          groups: formGroups,
          canUpdate: true,
          canEnforce: true,
          canOverwrite: true,
        }),
        onListTargets: async () => ({ items: [] }),
        onOverwrite: async () => {},
      },
      onSave: async () => ({ ok: true as const, groups: formGroups }),
    }),
  );
  assert.match(html, /Settings scope/);
  assert.match(html, /System — Primary settings/);
  assert.match(html, /GLOBAL/);
  assert.match(html, /Enforcement and tenant overwrites/);
  assert.equal((html.match(/data-smart-button="save"/g) ?? []).length, 1);
});
