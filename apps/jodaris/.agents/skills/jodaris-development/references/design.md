# Design reference

Status: initial implementation baseline, captured 2026-09-30. This records the supplied
landing page; it is not a separately commissioned or legally certified brand identity.
Source: `index.html` and the project-root `jodaris-desktop-hero.png`.

## Direction

A restrained editorial technology identity: dark botanical/ink surfaces, warm ivory
content sections, electric-lime emphasis, oversized headlines, and precise linework.
The composition balances human curiosity with engineering discipline. Preserve that
contrast rather than replacing it with generic gradients, stock technology photography,
excessive glass effects, or dense dashboard styling.

## Tokens

`design-tokens.json` captures the exact current `:root` CSS variables. Key values:

| Role | Token | Value |
| --- | --- | --- |
| Main dark surface/text | `--ink` | `#101d1b` |
| Deeper dark | `--ink-deep` | `#0b1514` |
| Soft dark | `--ink-soft` | `#1a2a26` |
| Main light surface | `--paper` | `#f3f2e9` |
| Warm white | `--white` | `#fffef6` |
| Accent | `--lime` | `#d5f478` |
| Muted text | `--muted` | `#a4b2a9` |
| Dark-surface rule | `--line-dark` | `rgba(240, 245, 224, .15)` |
| Light-surface rule | `--line-light` | `rgba(16, 29, 27, .17)` |

Use lime as an accent, not for all text. Preserve clear foreground/background contrast.
Contrast and usability must still be tested; the baseline is not a compliance certificate.

## Typography and spacing

The page has no downloaded fonts. The sans-serif stack begins with `-apple-system`,
`BlinkMacSystemFont`, and `Segoe UI`, then Arial. Editorial italic phrases use Georgia
with Times New Roman fallback. Technical captions use SFMono-Regular/Consolas/
Liberation Mono/monospace. Preserve the hierarchy; rendering varies by operating system.
Do not add font files to this project without a deliberate licensing/performance decision.

The wrapper maximum is `1440px`. Horizontal gutters use
`clamp(24px, 5.55vw, 100px)`. Large headings, generous whitespace, section numbers,
thin rules, uppercase microcopy, and restrained rounded details are core motifs.
Use existing tokens and fluid sizing before introducing independent values.

## Page anatomy

Header: compact monogram plus spaced JODARIS wordmark; main anchors; contact CTA.
Hero: left-aligned three-line headline and concise introduction; right-side connected
core visualization with four orbital discipline labels and motion controls.
Expertise: a lighter section with four equal-weight discipline cards and simple line art.
Mindset: strong editorial statement with supporting beliefs and geometric motif.
Approach: four-stage tabbed narrative with diagrams that support, not replace, the text.
Contact: prominent invitation, visible contact email, accessible conversation dialog.
Footer: company identity, four disciplines, copyright year, and back-to-top link.

## Graphic language

The monogram and icons are inline SVG; the hero is Canvas/SVG/CSS. The desktop preview
is a screenshot of the design, not an image that the page loads. Do not replace the
interactive hero with that screenshot as an implementation shortcut. Decorative visuals
remain hidden from assistive technology when the adjacent text communicates the meaning.

## Responsive behavior

Current CSS breakpoints: minimum `1500px`; maximum `1100px`, `820px`, `640px`, and
`360px`. Keep the header's JavaScript mobile-close threshold aligned with its CSS.
Validate at 1440, 1024, 820, 640, 390, and 320 CSS pixels; the intermediate values matter.
Avoid line breaks or fixed widths that work only in the desktop screenshot. Check 200%
zoom, long labels, browser font differences, touch interaction, and landscape orientation.

## Motion

Easing baseline: `cubic-bezier(.22, 1, .36, 1)`. Motion supports the connected-disciplines
idea and quiet feedback. Preserve reduced-motion and pause controls. Do not allow pointer
tracking on coarse-pointer devices or use motion as the sole route to information.
Avoid animation loops when the document/scene is not visible. See `interactions.md`.

## Evolution

A migration should preserve visual intent, not force an exact copy of incidental DOM.
Establish visual parity before intentional redesign. Record token/typography/structure
changes and refresh the screenshot only after browser review. Keep branding configurable
in the consuming app; never hardcode JODARIS into reusable CloudIgniter packages.
