import assert from "node:assert/strict";
import test from "node:test";
import type { CiBreadcrumbItem } from "@cloudigniter/core/types";
import { ciResolveBreadcrumbMenuItems } from "../../src/client/page/ci-resolve-breadcrumb-menu-items";
import { dashboardBreadcrumbChildren } from "../../../../apps/templates/cloudigniter-next-aws-v1/src/app/(system)/dashboard/breadcrumb-menu";

const translate = (key: string) => key;

test("Dashboard exposes Security → Roles directly from the public settings page", () => {
  const menu = ciResolveBreadcrumbMenuItems(
    dashboardBreadcrumbChildren, "/dashboard/settings/public", translate, "en",
  );
  const security = menu.find((entry) => entry.item.href === "/dashboard/security");
  assert.ok(security);
  assert.equal(security.current, false);
  assert.ok(security.children.some((entry) => entry.item.href === "/dashboard/security/roles"));
  assert.deepEqual(
    menu.find((entry) => entry.item.href === "/dashboard/settings")?.children.map((entry) => entry.label),
    ["Private settings"],
  );
});

test("sorts translated siblings at every depth without mutating the supplied tree", () => {
  const items: CiBreadcrumbItem[] = [{ label: "Z", children: [
    { label: "Z child" },
    { i18nKey: "first", children: [{ label: "Z leaf" }, { label: "A leaf" }] },
  ] }, { label: "A" }];
  const before = structuredClone(items);
  const result = ciResolveBreadcrumbMenuItems(items, "/elsewhere", () => "A child", "en");
  assert.deepEqual(result.map((entry) => entry.label), ["A", "Z"]);
  assert.deepEqual(result[1]?.children.map((entry) => entry.label), ["A child", "Z child"]);
  assert.deepEqual(result[1]?.children[0]?.children.map((entry) => entry.label), ["A leaf", "Z leaf"]);
  assert.deepEqual(items, before);
});

test("retains the current section as a submenu and excludes hidden subtrees/current leaves", () => {
  const result = ciResolveBreadcrumbMenuItems([
    { label: "Hidden", hidden: true, children: [{ label: "Also hidden", href: "/hidden/child" }] },
    { label: "Current section", href: "/section/?view=all", children: [
      { label: "Current leaf", current: true, href: "/section/current" },
      { label: "Available", href: "/section/available" },
    ] },
  ], "/section", translate, "en");
  assert.equal(result.length, 1);
  assert.equal(result[0]?.current, true);
  assert.deepEqual(result[0]?.children.map((entry) => entry.label), ["Available"]);
});

test("parents with no visible children become plain links, and current empty sections disappear", () => {
  const children: CiBreadcrumbItem[] = [{ label: "Hidden", hidden: true }];
  const result = ciResolveBreadcrumbMenuItems([
    { label: "Link", href: "/link", children },
    { label: "Current", href: "/current", children },
  ], "/current", translate, "en");
  assert.equal(result.length, 1);
  assert.equal(result[0]?.item.href, "/link");
  assert.equal(result[0]?.children.length, 0);
});
