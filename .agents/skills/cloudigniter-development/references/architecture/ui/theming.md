# Theming across CloudIgniter UI

Read this reference for every new or changed UI component, page, layout, CSS surface, theme configuration, or
widget integration. Dark-mode support is part of the component contract across the CloudIgniter ecosystem.

## Shared ownership and configuration

- Generic theme contracts belong to `packages/core`; the Next.js provider, resolver, switcher, standard layout
  styles, and token definitions belong to `packages/next`; reusable components and color-mode observation belong
  to `packages/ui`. Provider token construction stays in its provider package. Template code supplies configuration
  and custom styles.
- Preserve `CiLayout -> CiPageWrapper -> CiClientWrapper -> CiThemeProvider`. Pass generic fields under
  `themeConfig.theme`, with raw overrides under `themeConfig.themeProviderProps`. Never override the user's
  `attribute` or `defaultTheme` inside a layout or add another provider for a page-local styling fix.
- Precedence is defaults, defined generic fields, then defined raw overrides. Undefined values do not erase
  defaults. `useSystemPreference` overrides the legacy `enableSystem`; raw provider options win last. A disabled
  System default resolves to the first supported theme or Light; persisted System is corrected after mounting.
- The switcher reads effective provider choices/selection, disables choices while forced, and keeps initial
  hydration markup independent of browser persistence. Theme storage belongs to the provider.

## Color and selector contract

- Pair every surface with its semantic foreground: background/foreground, surface/surface-foreground,
  card/card-foreground, popover/popover-foreground, primary/primary-foreground, and accent/accent-foreground.
  Use muted-foreground for secondary text; use border, input, and ring tokens for controls and focus.
- Use success/info/warning/danger surface, foreground, and border families for status. Shadcn destructive/sidebar
  tokens are aliases onto the same CloudIgniter theme. Do not introduce a second neutral palette or undefined aliases.
- Both `.dark` and `[data-theme="dark"]` must activate semantic tokens and `dark:` utilities, including the marker
  element itself and descendants. Keep the document marker so menus/dialogs portaled to `body` inherit the theme.
  An OS media query alone must not override manual Light/Dark selection.
- Keep dropdown and submenu surfaces opaque with popover foreground/background, border, and menu-layer tokens.
  Check the primitive's utility classes as well as shared component CSS: utility-layer `z-50` overrides
  component-layer `z-menu`. Use the same menu token on the panel and its actual positioning wrapper: Radix's fixed
  Popper wrapper owns the stacking context and caches an inline index from the panel. Preserve the shared scoped
  wrapper rule that overrides that snapshot for dropdown/submenu content slots. Verify the outer wrapper sits
  above the header; raising only the inner panel does not repair a lower parent stacking context. Do not raise
  every Popper wrapper indiscriminately; other overlay types have their own layers.
- Prefer semantic tokens over `bg-white`, `text-black`, fixed gray shades, or paired light/dark palette utilities.
  Fixed brand imagery, syntax colors, and overlay scrims are acceptable when intentionally paired and readable.
  Inspect selected, hover, focus, disabled, placeholder, loading, empty, and error states in both modes.
- Check the whole brand mark against its actual button surface, including dark outlines around colored artwork.
  Prefer `fill="none"` and `stroke="currentColor"` for outline icons so they inherit the semantic foreground.
  For theme-specific artwork, switch visibility through the shared dark selectors with stable markup and equal
  dimensions in both modes; use the applied document theme, including resolved System appearance.
  Keep Dark-mode controls on subdued semantic surfaces; use a scoped icon edge treatment or a verified theme-specific
  asset for contrast. Verify generated PNG transparency before
  integrating a variant; a painted checkerboard is not an alpha channel. Keep decorative ripples visible against
  both page backgrounds, behind an opaque control face, and respect reduced-motion preferences.
- Token values are CSS colors (including OKLCH). Do not wrap full token values in `hsl()` or use obsolete
  `--sidebar-*` color names. Edit modular theme sources and regenerate `theme.generated.css` with `build:theme`.
- Keep application overrides in `src/custom/styles/standard/style.css`, after standard imports. Preserve Tailwind
  package sources and the shared dark variant; do not reintroduce a class-only custom variant in the template.

## Widgets and hydration

Use CSS for ordinary markup. When a widget needs an imperative Light/Dark value, use `useCiColorMode()` from
`@cloudigniter/ui/client`; it observes root class/data-theme mutations, supports forced/mapped themes, and falls
back to OS preference only without standard markers. It returns Light during SSR/first hydration and updates in
an effect. Do not add direct next-themes dependencies to `packages/ui`, independent storage readers, or extra mode
observers for editors, notifications, charts, or provider widgets. Preserve explicit widget theme overrides.

## Completion checks

- Cover app-standard, cp-standard, and login-standard pages, headers, footers, and portaled content.
- Check Light, Dark, System, both DOM strategies, forced mode, and reload persistence. Check manual Light on a
  dark OS and manual Dark on a light OS. Verify foreground/background contrast, mobile, keyboard focus, and RTL.
- For theme wiring or shared CSS changes, run the configuration regressions under `packages/next/__tests__/theme`
  and compiled CSS regressions in `apps/templates/cloudigniter-next-aws-v1/__tests__/theme-styles.test.ts`, plus owner/consumer type checks.
  Browser validation remains necessary for visual claims; report unavailable checks accurately.
- Keep `docs/docs/configuration/themes.mdx`, the theme API reference, and contributor theming
  architecture aligned when the strategies, defaults, integrations, or supported customization behavior changes.
