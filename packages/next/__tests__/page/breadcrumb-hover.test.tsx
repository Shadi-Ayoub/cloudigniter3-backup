import assert from "node:assert/strict";
import { createRequire, registerHooks } from "node:module";
import test from "node:test";
import { isValidElement, type ReactElement } from "react";
import type { CiBreadcrumbItem } from "@cloudigniter/core/types";
import type { CiBreadcrumbsProps } from "../../src/client/page/CiBreadcrumbs";

type Props = Record<string, unknown> & { children?: unknown };
type Node = ReactElement<Props>;
type Handler = (event?: unknown) => void;
const boundaryKey = Symbol.for("cloudigniter.breadcrumb-test-boundaries");
const boundaries: Record<string, Record<string, unknown>> = {};
Object.defineProperty(globalThis, boundaryKey, { value: boundaries, configurable: true });
const subject = new URL("../../src/client/page/CiBreadcrumbs.tsx", import.meta.url).href;
const imports: Record<string, string[]> = {
  react: ["useCallback", "useEffect", "useId", "useMemo", "useRef", "useState"],
  "lucide-react": ["ChevronDown", "ChevronRight"],
  "next/navigation": ["usePathname"],
  "next-intl": ["useTranslations", "useLocale"],
  "@cloudigniter/ui/client": ["DropdownMenu", "DropdownMenuContent", "DropdownMenuItem", "DropdownMenuPortal",
    "DropdownMenuSub", "DropdownMenuSubContent", "DropdownMenuSubTrigger", "DropdownMenuTrigger"],
  "../navigation": ["CiNextNavigateWithLoader"],
};
// Load the real source through the normal TS loader so coverage maps to TSX.
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (context.parentURL?.startsWith(subject) && imports[specifier]) {
      const source = imports[specifier].map((name) => {
        const value = ["react", "next/navigation", "next-intl"].includes(specifier)
          ? `(...args) => globalThis[Symbol.for("cloudigniter.breadcrumb-test-boundaries")][${JSON.stringify(specifier)}][${JSON.stringify(name)}](...args)`
          : JSON.stringify(name === "CiNextNavigateWithLoader" ? "Navigate" : name);
        return `export const ${name} = ${value};`;
      }).join("\n");
      return { url: `data:text/javascript,${encodeURIComponent(source)}`, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
const { CiBreadcrumbs } = await import("../../src/client/page/CiBreadcrumbs");
hooks.deregister();

// Exercise component event handlers with deterministic React/framework boundaries.
// Portals deliberately remain separate regions, as they are in the browser.
function renderBreadcrumbs(items: CiBreadcrumbItem[], options: Omit<CiBreadcrumbsProps, "items"> = {}) {
  const require = createRequire(import.meta.url);
  const states = new Map<string, unknown>();
  const refs = new Map<string, { current: unknown }>();
  const effects: (() => void | (() => void))[] = [];
  const timers = new Map<number, () => void>();
  const listeners = new Map<string, Set<() => void>>();
  let scope = "";
  let cursor = 0;
  let timerId = 0;
  let nodes: Node[] = [];
  const translate = (key: string) => key;
  const document = { activeElement: null as unknown, hidden: false,
    addEventListener: (name: string, fn: () => void) => {
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name)!.add(fn);
    },
    removeEventListener: (name: string, fn: () => void) => {
      listeners.get(name)?.delete(fn);
      if (!listeners.get(name)?.size) listeners.delete(name);
    },
  };
  const window = { addEventListener: document.addEventListener, removeEventListener: document.removeEventListener };
  class MenuElement {
    constructor(private id: unknown) {}
    closest() { return this; }
    getAttribute() { return this.id; }
  }
  const react = {
    ...require("react"),
    useId: () => `menu-${scope}`,
    useMemo: (fn: () => unknown) => fn(),
    useCallback: (fn: unknown) => fn,
    useRef: (value: unknown) => {
      const key = `${scope}-${cursor++}`;
      if (!refs.has(key)) refs.set(key, { current: value });
      return refs.get(key);
    },
    useState: (value: unknown) => {
      const key = `${scope}-${cursor++}`;
      if (!states.has(key)) states.set(key, value);
      return [states.get(key), (next: unknown) => states.set(key, next)];
    },
    useEffect: (fn: () => void | (() => void), deps: unknown[]) => {
      const key = `${scope}-${cursor++}`;
      const previous = states.get(key) as unknown[] | undefined;
      if (!previous || deps.some((dep, i) => dep !== previous[i])) {
        effects.push(fn);
        states.set(key, deps);
      }
    },
  };
  // Keep callbacks stable across renders, matching useCallback's dependency contract.
  react.useCallback = (fn: unknown) => {
    const key = `${scope}-${cursor++}`;
    if (!states.has(key)) states.set(key, fn);
    return states.get(key);
  };
  Object.assign(boundaries, {
    react,
    "next/navigation": { usePathname: () => "/current" },
    "next-intl": { useTranslations: () => translate, useLocale: () => "en" },
  });
  const globals = { document, window, Element: MenuElement,
    setTimeout: (fn: () => void) => { timers.set(++timerId, fn); return timerId; },
    clearTimeout: (id: number) => timers.delete(id),
  };
  const originalGlobals = Object.fromEntries(Object.keys(globals).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(globals)) {
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  }

  function visit(value: unknown, key: string): void {
    if (Array.isArray(value)) { value.forEach((child, i) => visit(child, `${key}-${i}`)); return; }
    if (!isValidElement<Props>(value)) return;
    if (typeof value.type === "function") {
      scope = key;
      cursor = 0;
      visit((value.type as (props: Props) => unknown)(value.props), `${key}-render`);
      return;
    }
    nodes.push(value);
    visit(value.props.children, `${key}-children`);
  }
  function render() {
    nodes = [];
    scope = "root";
    cursor = 0;
    visit(CiBreadcrumbs({ items, withChildrenMenu: true, ...options }), "root");
  }
  const get = (type: string, index = 0) => {
    const node = nodes.filter((entry) => entry.type as unknown === type)[index];
    assert.ok(node, `Expected ${type} at ${index}`);
    return node;
  };
  const fire = (node: Node, name: string, event?: unknown) => {
    assert.equal(typeof node.props[name], "function", `Expected ${name}`);
    (node.props[name] as Handler)(event);
    render();
  };
  render();
  const cleanups = effects.splice(0).map((effect) => effect()).filter((fn) => typeof fn === "function");
  render();
  return {
    get, fire, document, listeners,
    emit: (name: string) => { listeners.get(name)?.forEach((fn) => fn()); render(); },
    all: () => nodes,
    render,
    region: (node: Node) => new MenuElement(node.props["data-ci-breadcrumb-menu"]),
    trigger: () => nodes.find((node) => node.type === "span" && typeof node.props.onMouseEnter === "function")!,
    flush: () => { for (const [id, fn] of timers) { timers.delete(id); fn(); } render(); },
    cleanup: () => {
      cleanups.forEach((fn) => fn());
      for (const [key, descriptor] of Object.entries(originalGlobals)) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else Reflect.deleteProperty(globalThis, key);
      }
    },
  };
}

const items: CiBreadcrumbItem[] = [
  { label: "Dashboard", href: "/dashboard", children: [
    { label: "Security", href: "/security", children: [{ label: "Roles", href: "/roles" }] },
    { label: "Settings", href: "/settings" },
  ] },
  { label: "Current", current: true },
];

test("returning from a portaled child to its parent keeps the whole breadcrumb menu open", () => {
  const view = renderBreadcrumbs(items);
  view.fire(view.trigger(), "onMouseEnter");
  assert.equal(view.get("DropdownMenu").props.open, true);
  view.fire(view.get("DropdownMenuSubContent"), "onMouseLeave", {
    relatedTarget: view.region(view.get("DropdownMenuContent")),
  });
  // React need not emit another parent mouse-enter when leaving its portal.
  view.flush();
  assert.equal(view.get("DropdownMenu").props.open, true);
  view.cleanup();
});

test("moving between menu regions and the disclosure keeps it open; leaving all regions closes it", () => {
  const view = renderBreadcrumbs(items);
  view.fire(view.trigger(), "onMouseEnter");
  view.fire(view.get("DropdownMenuContent"), "onMouseLeave", {
    relatedTarget: view.region(view.get("DropdownMenuSubContent")),
  });
  view.flush();
  assert.equal(view.get("DropdownMenu").props.open, true);
  view.fire(view.get("DropdownMenuSubContent"), "onMouseLeave", { relatedTarget: view.region(view.trigger()) });
  view.flush();
  assert.equal(view.get("DropdownMenu").props.open, true);
  view.fire(view.trigger(), "onMouseLeave", { relatedTarget: null });
  view.flush();
  assert.equal(view.get("DropdownMenu").props.open, false);
  view.cleanup();
});

test("crossing a gap can be cancelled on re-entry and keyboard interaction survives mouse leave", () => {
  const view = renderBreadcrumbs(items);
  view.fire(view.trigger(), "onMouseEnter");
  view.fire(view.trigger(), "onMouseLeave", { relatedTarget: null });
  view.fire(view.get("DropdownMenuContent"), "onMouseEnter");
  view.flush();
  assert.equal(view.get("DropdownMenu").props.open, true);
  view.fire(view.get("DropdownMenuContent"), "onKeyDownCapture");
  view.fire(view.get("DropdownMenuContent"), "onMouseLeave", { relatedTarget: null });
  view.flush();
  assert.equal(view.get("DropdownMenu").props.open, true);
  view.fire(view.get("DropdownMenuContent"), "onPointerMoveCapture");
  view.fire(view.get("DropdownMenuContent"), "onMouseLeave", { relatedTarget: null });
  view.flush();
  assert.equal(view.get("DropdownMenu").props.open, false);
  view.cleanup();
});

test("window blur, tab hiding and link navigation dismiss the dropdown", () => {
  const view = renderBreadcrumbs(items);
  for (const name of ["blur", "visibilitychange"]) {
    view.fire(view.trigger(), "onMouseEnter");
    view.document.hidden = name === "visibilitychange";
    view.emit(name);
    assert.equal(view.get("DropdownMenu").props.open, false);
  }
  view.document.hidden = false;
  view.fire(view.trigger(), "onMouseEnter");
  view.emit("visibilitychange");
  assert.equal(view.get("DropdownMenu").props.open, true);
  view.fire(view.get("Navigate"), "onNavigateStart");
  assert.equal(view.get("DropdownMenu").props.open, false);
  view.cleanup();
  assert.equal(view.listeners.size, 0);
});

test("parent links retain Enter navigation and the arrow opens children without navigating", () => {
  const view = renderBreadcrumbs(items);
  let prevented = 0;
  let followed = 0;
  const preventDefault = () => prevented++;
  view.fire(view.get("Navigate", 1), "onKeyDown", { key: "ArrowRight", preventDefault });
  assert.equal(prevented, 0);
  view.fire(view.get("Navigate", 1), "onKeyDown", {
    key: "Enter", preventDefault, currentTarget: { click: () => followed++ },
  });
  assert.equal(followed, 1);
  assert.equal(prevented, 1);
  const arrow = view.all().find((node) => Object.hasOwn(node.props, "data-breadcrumb-expand"))!;
  view.fire(arrow, "onClick", { preventDefault });
  assert.equal(view.get("DropdownMenuSub").props.open, true);
  assert.equal(followed, 1);
  view.cleanup();
});

test("keyboard dismissal retains disclosure focus while pointer dismissal clears it", () => {
  const view = renderBreadcrumbs(items);
  let blurred = 0;
  let prevented = 0;
  const button = { blur: () => { blurred++; view.document.activeElement = null; } };
  const ref = view.get("DropdownMenuTrigger").props.ref as { current: unknown };
  ref.current = button;
  view.document.activeElement = button;
  view.fire(view.trigger(), "onKeyDownCapture");
  view.fire(view.get("DropdownMenuContent"), "onCloseAutoFocus", { preventDefault: () => prevented++ });
  assert.equal(prevented, 0);
  assert.equal(blurred, 0);
  view.fire(view.trigger(), "onPointerDownCapture");
  view.fire(view.get("DropdownMenuContent"), "onCloseAutoFocus", { preventDefault: () => prevented++ });
  assert.equal(prevented, 1);
  assert.equal(blurred, 1);
  view.fire(view.trigger(), "onMouseEnter");
  view.document.activeElement = button;
  view.fire(view.get("DropdownMenuContent"), "onPointerDownCapture");
  view.fire(view.get("Navigate"), "onNavigateStart");
  assert.equal(blurred, 2);
  assert.equal(view.get("DropdownMenu").props.open, false);
  view.cleanup();
});

test("current sections remain expandable, missing destinations are disabled, and empty sections remain links", () => {
  const view = renderBreadcrumbs([
    { i18nKey: "dashboard", href: "/dashboard", icon: "home", children: [
      { label: "Current section", current: true, icon: "section", children: [{ label: "Child", href: "/child" }] },
      { label: "Unavailable", icon: "lock" },
      { label: "Unlinked parent", children: [{ href: "/anonymous" }] },
    ] },
    { label: "Empty", href: "/empty" },
    { label: "Active", current: true, children: [{ label: "Leaf", href: "/leaf" }] },
  ], { dir: "rtl", className: "custom" });
  assert.equal(view.get("nav").props.dir, "rtl");
  assert.equal(view.get("nav").props.className, "custom");
  assert.ok(view.all().some((node) => node.type as unknown === "DropdownMenuItem" && node.props.disabled));
  assert.ok(view.all().some((node) => node.type as unknown === "Navigate" && node.props.href === "/empty"));
  assert.equal(view.get("DropdownMenuSubTrigger").props.textValue, "Current section");
  assert.equal(view.get("script").props.type, "application/ld+json");
  view.cleanup();
});

test("plain breadcrumbs preserve labels, current-page semantics and optional structured data", () => {
  for (const withChildrenMenu of [true, false]) {
    const view = renderBreadcrumbs([
      { label: "Hidden", hidden: true },
      { href: "/dashboard", i18nKey: "dashboard", icon: "home" },
      {},
      { label: "Last", href: "/last" },
    ], { withChildrenMenu, withStructuredData: false });
    assert.equal(view.all().filter((node) => node.type === "li").length, 3);
    assert.ok(!view.all().some((node) => node.type === "script"));
    assert.equal(view.all().filter((node) => node.type as unknown === "Navigate").length, 1);
    assert.ok(view.all().some((node) => node.props["aria-current"] === "page"));
    view.cleanup();
  }
  const view = renderBreadcrumbs([{ label: "Last without link" }], { withChildrenMenu: false });
  assert.ok(view.all().some((node) => node.props["aria-current"] === "page"));
  view.cleanup();
});
