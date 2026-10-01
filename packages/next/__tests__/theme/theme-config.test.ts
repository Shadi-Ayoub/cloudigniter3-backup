import assert from "node:assert/strict";
import test from "node:test";
import { ciMapThemeConfigToNextThemeProviderProps } from "../../src/lib/theme/ci-map-theme-config-to-next-theme-provider-props";
import { ciResolveNextThemeProviderProps } from "../../src/lib/theme/ci-resolve-next-theme-provider-props";

test("absent and partial configuration preserve CloudIgniter defaults", () => {
  for (const input of [undefined, {}, { theme: {} }, { theme: { storageKey: undefined } }]) {
    const props = ciResolveNextThemeProviderProps(input);
    assert.equal(props.attribute, "class");
    assert.equal(props.defaultTheme, "system");
    assert.equal(props.storageKey, "ci-theme");
    assert.equal(props.enableSystem, true);
    assert.equal(props.enableColorScheme, true);
  }
  assert.deepEqual(ciMapThemeConfigToNextThemeProviderProps(), {});
});

test("generic config reaches the provider and defined raw overrides take precedence", () => {
  const props = ciResolveNextThemeProviderProps({
    theme: {
      defaultTheme: "dark",
      storageKey: "my-theme",
      attributeStrategy: "data-theme",
      supportedThemes: ["light", "dark"],
      disableTransitionOnChange: true,
      enableColorScheme: false,
    },
    themeProviderProps: { defaultTheme: "light", storageKey: undefined, forcedTheme: "dark" },
  });
  assert.equal(props.defaultTheme, "light");
  assert.equal(props.forcedTheme, "dark");
  assert.equal(props.attribute, "data-theme");
  assert.equal(props.storageKey, "my-theme");
  assert.equal(props.disableTransitionOnChange, true);
  assert.equal(props.enableColorScheme, false);
  assert.deepEqual(props.themes, ["light", "dark"]);
});

test("system preference flag supports the legacy name and explicit precedence", () => {
  assert.equal(ciResolveNextThemeProviderProps({ theme: { enableSystem: false } }).enableSystem, false);
  assert.equal(ciResolveNextThemeProviderProps({ theme: { enableSystem: false, useSystemPreference: true } }).enableSystem, true);
  assert.equal(ciResolveNextThemeProviderProps({
    theme: { useSystemPreference: true }, themeProviderProps: { enableSystem: false },
  }).enableSystem, false);
});

test("disabling system preference chooses a concrete default and preserves explicit dark", () => {
  assert.equal(ciResolveNextThemeProviderProps({ theme: { enableSystem: false } }).defaultTheme, "light");
  assert.equal(ciResolveNextThemeProviderProps({ theme: { useSystemPreference: false, defaultTheme: "dark" } }).defaultTheme, "dark");
  assert.equal(ciResolveNextThemeProviderProps({ theme: { useSystemPreference: false, supportedThemes: ["dark"] } }).defaultTheme, "dark");
});

test("theme names can map to the standard DOM values without changing persistence names", () => {
  const props = ciResolveNextThemeProviderProps({ theme: {
    supportedThemes: ["day", "night"],
    defaultTheme: "night",
    themeValueMap: { day: "light", night: "dark" },
  } });
  assert.equal(props.defaultTheme, "night");
  assert.deepEqual(props.value, { day: "light", night: "dark" });
});
