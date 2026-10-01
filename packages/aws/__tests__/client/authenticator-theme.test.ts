import assert from "node:assert/strict";
import test from "node:test";
import { createTheme } from "@aws-amplify/ui-react";
import { ciBuildDefaultThemeFromTokens } from "../../src/client/auth/ci-build-default-theme-from-tokens";

const { tokens } = createTheme();

for (const mode of ["light", "dark"] as const) {
  test(`default ${mode} authenticator pairs labels and inputs with its surface`, () => {
    const theme = ciBuildDefaultThemeFromTokens(tokens, mode);
    const foreground = tokens.colors.neutral[mode === "dark" ? 10 : 90].value;
    const background = tokens.colors.neutral[mode === "dark" ? 90 : 10].value;
    assert.equal(theme.tokens?.colors?.font?.primary, foreground);
    assert.equal(theme.tokens?.colors?.background?.primary, background);
    assert.equal(theme.tokens?.components?.fieldcontrol?.color, foreground);
    assert.equal(theme.tokens?.components?.authenticator?.router?.backgroundColor, background);
    assert.equal(theme.tokens?.components?.button?.primary?.backgroundColor, tokens.colors.purple[mode === "dark" ? 40 : 80].value);
    assert.equal(theme.tokens?.components?.button?.primary?.color, tokens.colors.neutral[mode === "dark" ? 100 : 10].value);
    assert.equal(theme.tokens?.components?.button?.primary?._hover?.backgroundColor, tokens.colors.purple[mode === "dark" ? 20 : 90].value);
    assert.notEqual(foreground, background);
  });
}
