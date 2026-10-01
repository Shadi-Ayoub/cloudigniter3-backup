import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test, { before } from "node:test";
import { fileURLToPath } from "node:url";
import postcss, { type Result } from "postcss";
import tailwindcss from "@tailwindcss/postcss";

const globals = new URL("../src/app/globals.css", import.meta.url);
let result: Result;
before(async () => {
  const stylesheet = await readFile(globals, "utf8");
  result = await postcss([tailwindcss({ optimize: false })]).process(
    `${stylesheet}\n@source inline("dark:bg-background bg-destructive text-destructive-foreground bg-sidebar text-sidebar-foreground border-sidebar-border");`,
    { from: fileURLToPath(globals) },
  );
});

// Convert the standard palette's opaque sRGB/OKLCH colors to relative luminance.
function luminance(color: string): number {
  if (/^#[\da-f]{6}$/i.test(color)) {
    const channels = [1, 3, 5].map((offset) => parseInt(color.slice(offset, offset + 2), 16) / 255);
    const linear = channels.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
  }
  const match = /^oklch\(([\d.]+)(%)?\s+([\d.]+)\s+([\d.]+)\)$/.exec(color);
  assert.ok(match, `Unsupported palette color: ${color}`);
  const lightness = Number(match[1]) / (match[2] ? 100 : 1);
  const chroma = Number(match[3]);
  const hue = Number(match[4]) * Math.PI / 180;
  const a = chroma * Math.cos(hue);
  const b = chroma * Math.sin(hue);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clamp = (value: number) => Math.max(0, Math.min(1, value));
  return 0.2126 * clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)
    + 0.7152 * clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)
    + 0.0722 * clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s);
}

test("application CSS compiles manual dark variants for both supported DOM strategies", () => {
  const selectors: string[] = [];
  result.root.walkRules((rule) => { selectors.push(rule.selector); });
  assert.ok(selectors.some((selector) => selector.includes(".dark") && selector.includes('[data-theme="dark"]')));
  const darkUtility = selectors.find((selector) => selector.includes("dark\\:bg-background"));
  assert.ok(darkUtility, "Tailwind must discover and emit dark utilities");
  assert.doesNotMatch(result.css, /@media\s*\(prefers-color-scheme:\s*dark\)/);
});

test("semantic colors resolve with readable text contrast in light and dark modes", () => {
  const light = new Map<string, string>();
  const dark = new Map<string, string>();
  result.root.walkRules((rule) => {
    const target = rule.selector.includes("[data-theme=") && rule.selector.includes(".dark")
      ? dark : rule.selector.includes(":root") ? light : null;
    if (target) rule.walkDecls(/^--color-/, (decl) => { target.set(decl.prop, decl.value); });
  });
  function resolve(name: string, mode: "light" | "dark", seen = new Set<string>()): string {
    assert.ok(!seen.has(name), `Cyclic token: ${name}`);
    seen.add(name);
    const value = (mode === "dark" ? dark.get(name) : undefined) ?? light.get(name);
    assert.ok(value, `Missing ${mode} token: ${name}`);
    const reference = /^var\((--[\w-]+)\)$/.exec(value);
    return reference ? resolve(reference[1]!, mode, seen) : value;
  }
  const contrastFailures: string[] = [];
  for (const mode of ["light", "dark"] as const) {
    for (const surface of ["background", "surface", "surface-muted", "card", "popover", "primary", "secondary", "accent", "muted", "sidebar", "destructive", "success", "info", "warning", "danger", "success-surface", "info-surface", "warning-surface", "danger-surface"]) {
      const foreground = surface === "background" ? "foreground" : `${surface}-foreground`;
      const backgroundLuminance = luminance(resolve(`--color-${surface}`, mode));
      const foregroundLuminance = luminance(resolve(`--color-${foreground}`, mode));
      const contrast = (Math.max(backgroundLuminance, foregroundLuminance) + 0.05)
        / (Math.min(backgroundLuminance, foregroundLuminance) + 0.05);
      if (contrast < 4.5) contrastFailures.push(`${mode} ${surface}: ${contrast.toFixed(2)}:1 text contrast`);
    }
    assert.equal(resolve("--color-sidebar-border", mode), resolve("--color-border", mode));
    assert.equal(resolve("--color-destructive", mode), resolve("--color-danger", mode));
  }
  assert.deepEqual(contrastFailures, [], "Semantic text pairs must reach 4.5:1");
  assert.notEqual(resolve("--color-background", "light"), resolve("--color-background", "dark"));
  assert.notEqual(resolve("--color-foreground", "light"), resolve("--color-foreground", "dark"));
});

test("the document and all standard layout surfaces use semantic foreground/background pairs", () => {
  const selectors = ["body", ".ci-body", ".ci-main-header", ".ci-main-footer", ".ci-main-login-footer", ".ci-page-header-main"];
  for (const selector of selectors) {
    const declarations = new Map<string, string>();
    result.root.walkRules((rule) => {
      if (rule.selector === selector) rule.walkDecls((decl) => { declarations.set(decl.prop, decl.value); });
    });
    assert.match(declarations.get("background-color") ?? "", /var\(--color-(background|surface)\)/, selector);
    assert.match(declarations.get("color") ?? "", /var\(--color-(foreground|surface-foreground)\)/, selector);
  }
});

test("header dropdown surfaces stay opaque and above the fixed header", async () => {
  const styles = new Map<string, Map<string, string>>();
  result.root.walkRules((rule) => {
    const declarations = styles.get(rule.selector) ?? new Map<string, string>();
    rule.nodes.forEach((node) => {
      if (node.type === "decl") declarations.set(node.prop, node.value);
    });
    styles.set(rule.selector, declarations);
  });

  const surface = styles.get(".ci-menu-content");
  assert.equal(surface?.get("background-color"), "var(--color-popover)");
  assert.equal(surface?.get("color"), "var(--color-popover-foreground)");
  assert.equal(surface?.get("border-color"), "var(--color-border)");
  assert.equal(surface?.get("isolation"), "isolate");
  assert.equal(styles.get(".bg-popover")?.get("background-color"), "var(--color-popover)");
  assert.equal(styles.get(".z-menu")?.get("z-index"), "var(--z-index-menu)");

  const tokens = new Map<string, string>();
  result.root.walkRules((rule) => {
    if (rule.selector.includes(":root")) {
      rule.walkDecls(/^--z-index-/, (decl) => { tokens.set(decl.prop, decl.value); });
    }
  });
  assert.ok(Number(tokens.get("--z-index-menu")) > Number(tokens.get("--z-index-layout")));
  assert.ok(Number(tokens.get("--z-index-menu")) > Number(tokens.get("--z-index-header")));
  assert.ok(Number(tokens.get("--z-index-menu")) < Number(tokens.get("--z-index-modal")));

  // Radix's fixed positioning wrapper owns the portal's stacking context and
  // caches an inline z-index. Raising only the inner panel cannot correct it.
  for (const slot of ["dropdown-menu-content", "dropdown-menu-sub-content"]) {
    const selector = `[data-radix-popper-content-wrapper]:has(> [data-slot="${slot}"])`;
    let wrapperLayerFound = false;
    result.root.walkRules((rule) => {
      if (!rule.selectors.includes(selector)) return;
      rule.walkDecls("z-index", (decl) => {
        assert.equal(decl.value, "var(--z-index-menu)");
        assert.equal(decl.important, true, "The wrapper layer must override Radix's inline snapshot");
        wrapperLayerFound = true;
      });
    });
    assert.ok(wrapperLayerFound, `Missing positioning-wrapper layer for ${slot}`);
  }

  // Utility layers outrank .ci-menu-content's component layer. Verify the actual
  // root and submenu primitives cannot silently lower the portal back to z-50.
  const primitive = await readFile(new URL("../../../packages/ui/src/client/components/shadcn/dropdown-menu.tsx", import.meta.url), "utf8");
  const surfaces = primitive.match(/"bg-popover[^"\n]+"/g) ?? [];
  assert.equal(surfaces.length, 2);
  for (const classes of surfaces) {
    assert.match(classes, /\bz-menu\b/);
    assert.match(classes, /\bborder-border\b/);
    assert.doesNotMatch(classes, /\bz-50\b|\bbg-transparent\b|\bbg-popover\//);
  }
});
