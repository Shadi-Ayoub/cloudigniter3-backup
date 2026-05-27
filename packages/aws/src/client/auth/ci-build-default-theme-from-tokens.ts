import type { Theme } from '@aws-amplify/ui-react';
import type { CiAmplifyTokens } from './types';

type TokenLeaf = { value: string } | string;

function tokenValue(x: unknown, fallback = ''): string {
  if (!x) return fallback;
  if (typeof x === 'string') return x;
  if (typeof x === 'object' && x !== null && 'value' in x && typeof (x as any).value === 'string') {
    return (x as any).value;
  }
  // If it's a nested group/object, fail safe
  return fallback;
}

function scale(tokens: unknown): Record<string, TokenLeaf> {
  return tokens as Record<string, TokenLeaf>;
}

export function ciBuildDefaultThemeFromTokens(tokens: CiAmplifyTokens, themeMode?: string): Theme {
  const raw = (themeMode ?? 'light').toLowerCase().trim();
  const mode: 'light' | 'dark' = raw === 'dark' ? 'dark' : 'light';
  const isDark = mode === 'dark';

  const n = scale(tokens.colors.neutral);
  const p = scale(tokens.colors.purple);
  const o = scale(tokens.colors.overlay);

  // ✅ Correct direction: 10/20 are light surfaces, 90/100 are dark surfaces
  const surfaceBg = isDark ? tokenValue(n['90'], tokenValue(n['100'])) : tokenValue(n['10'], tokenValue(n['20']));

  const surfaceBorder = isDark ? tokenValue(n['80'], tokenValue(n['70'])) : tokenValue(n['20'], tokenValue(n['30']));

  const primaryButtonBg = isDark ? tokenValue(p['60']) : tokenValue(p['80']);
  const primaryButtonText = tokenValue(n['10']); // light text

  const linkColor = isDark ? tokenValue(p['60']) : tokenValue(p['80']);
  const focusRing = isDark ? tokenValue(p['50']) : tokenValue(p['60']);
  const tabText = isDark ? tokenValue(n['40'], tokenValue(n['50'])) : tokenValue(n['80'], tokenValue(n['90']));
  const tabActiveText = isDark ? tokenValue(p['60']) : tokenValue(p['80']);
  const tabActiveBorder = isDark ? tokenValue(p['60']) : tokenValue(p['80']);
  const shadowColor = isDark ? tokenValue(o['40']) : tokenValue(o['10']);

  // IMPORTANT:
  // Some Amplify UI typings still declare these fields as DesignToken<string>,
  // even though runtime accepts raw strings. We keep the object shape and
  // cast at the end to avoid unions leaking into typed fields.
  const theme: any = {
    name: `ci-authenticator-default-style-theme-${mode}`,
    tokens: {
      components: {
        authenticator: {
          router: {
            backgroundColor: surfaceBg,
            borderWidth: '0',
            boxShadow: `0 0 16px ${shadowColor}`,
          },
          form: {
            padding: `${tokens.space.medium} ${tokens.space.xl} ${tokens.space.medium}`,
          },
        },
        button: {
          primary: {
            backgroundColor: primaryButtonBg,
            color: primaryButtonText,
            _hover: { backgroundColor: isDark ? tokenValue(p['70']) : tokenValue(p['90']) },
          },
          link: {
            color: linkColor,
            _hover: {
              // only allowed token fields here; no textDecoration in theme tokens
              color: linkColor,
            },
          },
        },
        fieldcontrol: {
          backgroundColor: surfaceBg,
          borderColor: surfaceBorder,
          _focus: {
            boxShadow: `0 0 0 2px ${focusRing}`,
            borderColor: focusRing,
          },
        },
        tabs: {
          item: {
            color: tabText,
            _active: { color: tabActiveText, borderColor: tabActiveBorder },
          },
        },
      },
    },
  };

  return theme as Theme;
}
