# Guide Presentation

Read this reference when changing the documentation theme, typography, layout, navigation, homepage, or custom
MDX presentation. Ordinary prose edits inherit the existing theme and do not require a full visual regression pass.

## Design direction and ownership

The guide adapts the typography and reading layout of
[Changesets](https://changesets.dev/guide/getting-started) within Docusaurus. Keep CloudIgniter's branding and
documentation structure. The reference is design inspiration, not a reason to migrate frameworks or copy its content.
Use `ui-ux-pro-max` for design work, with the current guide implementation and the user's request taking precedence
over generic style recommendations.

Inspect these sources before changing presentation; paths below are relative to `docs`:

| Responsibility | Source |
| --- | --- |
| Shared theme tokens, document typography, navigation, code, tables, callouts, and responsive rules | `src/css/custom.css` |
| Navigation, footer destinations, color-mode preference, and Prism themes | `docusaurus.config.ts` |
| Navbar wordmark and themed logos | `src/theme/Navbar/Logo/`, `static/img/logo.png`, `static/img/logo-dark.svg` |
| Homepage composition and styles | `src/pages/index.tsx`, `src/pages/index.module.css`, `src/components/HomepageFeatures/` |
| Dictionary overlay and its navbar control | `src/components/DictionaryViewer/`, `src/theme/NavbarItem/DictionaryViewerNavbarItem/` |
| Shared guide search and ranked results | `src/theme/SearchBar/`, `src/components/GuideSearchModal/`, `src/components/GuideSearchPage/`, `plugins/guide-search.ts` |
| Shared image/diagram enlargement | `src/components/MediaViewer/`, mounted by `src/theme/Root.tsx` |
| Updated timestamps and category-page footer alignment | `src/components/PageDates/`, `src/theme/DocCategoryGeneratedIndexPage/` |
| Local fonts and their SIL Open Font Licenses | `static/fonts/` |

Documentation-specific presentation belongs here. Do not move it into `packages/ui` or `packages/next`, or apply
the guide's font and color choices to the application template as part of a documentation task. Extend existing
Docusaurus components and CSS before introducing replacements; preserve native navigation, code copying, and accessibility.

## Current baseline

These are the current defaults, not constraints against an intentional redesign. Confirm them against source,
honor requested changes, and update this reference and the guide README when the defaults change.

| Element | Current default |
| --- | --- |
| Body | Inter, 16px with 28px line height |
| Document headings | Averia Serif Libre; 32px/40px page title, 28px section headings, 20px subsections |
| Small-screen document title | 28px at widths up to 576px |
| Code | System monospace stack, 14px block text, about 1.7 line height |
| Desktop navigation | 64px header, 272px sidebar, approximately 14px link text; compact search and one Dictionary dropdown with 44px viewer controls |
| Navbar brand | CloudIgniter Docs; muted Docs token, one 8px logo gap, color light-mode logo and Dev Beacon outline in dark mode |
| Desktop reading column | Maximum 688px; responsive gutters and a separate table of contents |
| Mobile navigation | Native Docusaurus menu at widths up to 996px; menu controls at least 44px tall |
| Colors | Neutral surfaces, blue links, blue-gray headings, corresponding dark-mode tokens |

The homepage has its own responsive heading scale. Do not let document-title rules override it.
Keep fonts locally hosted with `font-display: swap`, fallbacks, and their license files. Normal guide rendering
should not need Google Fonts or another third-party font service.

## Authoring and styling conventions

- Use semantic Markdown headings, native admonitions, fenced code blocks, and tables so shared styles apply consistently.
  Avoid inline fonts, fixed content widths, or independent palettes in individual MDX pages.
- Use existing `--ifm-*` and `--ci-doc-*` tokens in shared CSS and component CSS modules. Keep light and dark variants
  together; check text and syntax-comment contrast against the actual rendered surface.
- Preserve the intentional cascade: base tokens use `html:root`, dark overrides use `html:root[data-theme="dark"]`.
  Infima and generated theme styles can override less-specific rules. Verify computed styles in the production build
  when changing selectors or variables; development appearance alone does not establish the bundled result.
- Prefer stable Docusaurus classes. Scope necessary CSS-module prefix selectors to the intended component; a broad
  selector matching every `title` class can unintentionally resize the homepage. Check category pages as well as articles.
- Keep long code blocks and tables scrollable inside their containers. Preserve visible keyboard focus, reduced-motion
  support, and logical spacing properties where direction matters.
- Keep the navbar wordmark **CloudIgniter Docs**, with the Docs token in the secondary text color. Use a single
  8px gap between logo and title; clear Infima's logo margin to avoid adding spacing twice. Preserve the accessible
  brand name when responsive navigation hides the visible title. The dark SVG reuses the Dev Beacon outline geometry;
  keep it synchronized with `packages/ui/src/client/components/mark/CiDevBeaconIcon.tsx`. Both assets must retain
  the original 17:13 proportions (510 × 390 color image, 34 × 26 outline view box), with the same displayed
  dimensions, wide cloud silhouette, and horizontal cloud base. The canonical host is
  `https://docs.cloudigniter.io`; keep home navigation within the current guide/base URL.
- Keep the navbar focused on **User guide**, **Developer guide**, **API Reference**, and **CloudIgniter Commands**.
  One **Dictionary** dropdown contains the blue **Dictionary** and green **Developer Dictionary** rows,
  each pairing a viewer icon with its full-page link in desktop and mobile navigation. Keep **Skills**
  under **Resources**. The starter blog is disabled; add blog navigation only with maintained CloudIgniter content.
  Preserve existing guide routes when adjusting labels.
  Homepage and footer links should lead to real CloudIgniter resources; do not reintroduce starter Docusaurus destinations.
- Keep the compact navbar search available across guides. Clicking it or pressing **⌘K / Ctrl+K** opens a native
  dialog with live ranked results, highlighted excerpts, scope filters, loading/error/empty states, and arrow-key/Enter
  navigation. Preserve Escape dismissal, focus containment/return, and responsive light/dark styling. Load the index
  on demand. The local search plugin indexes published docs using their Docusaurus permalinks, **excluding both dictionaries
  at index generation**. The modal's View all results link opens `/search`, where query/scope are shareable in the
  URL and results load incrementally. Developer audience
  metadata is a future host integration seam, not authorization. Protect documents and index delivery together when
  access control is introduced. Preserve the Dictionary's separate term search.
- Article and generated-category footers include **Was this Doc helpful?** except in either dictionary. The current
  Yes/No handler displays an alert and saves nothing; feedback is available to all readers pending host integration.

## Visual verification

Guide Markdown images, ImageWrapper images and Mermaid SVGs use the shared media
viewer automatically. Keep its implementation in the guide, not application packages.
Preserve native-dialog focus containment, Escape/close and focus return, labelled
zoom/fit controls, vector SVG rendering, pointer dragging and arrow-key panning.
Use `data-media-zoom="off"` on a container to deliberately exclude decorative media.
Check a raster image and a Mermaid diagram at fit and enlarged sizes in both themes.

For presentation changes, run the existing date, typecheck, and production-build workflow, then inspect representative
affected pages in a browser. Reuse the current tooling; do not add runtime dependencies just to capture screenshots.

- For shared theme changes, cover a prose article, a page with code and tables, a callout, a generated category page,
  and the homepage or Dictionary Viewer when affected. Include the Users, Developers, and API surfaces as applicable.
- Check light and dark modes independently, including code comments and muted text. Ensure the requested mode is
  actually active: the current color-mode control cycles through system, light, and dark choices.
- Check desktop, tablet, and narrow mobile layouts. Useful sample widths are 1440, 1024, 768, 390, and 320px.
  Confirm font loading, readable widths, no horizontal page overflow, and usable mobile navigation.
- For changed controls, verify keyboard focus, sidebar and Resources navigation, code copying, and Dictionary
  opening, search, empty results, and closing as applicable. Check reduced motion and RTL when the changed layout is directional.
- Wait for hydration and relevant transitions before taking screenshots or asserting interaction results. A screenshot
  of a partially opened menu is not evidence of the finished layout. Native search inputs may consume Escape to clear
  their query; use the explicit close control when testing dismissal after search.

Review screenshots as well as automated assertions. Report any unavailable checks accurately. Stop a temporary
production preview after verification, restart the usual guide server, and verify the affected URL as described in
[the edit lifecycle](workflow-and-validation.md#docusaurus-edit-lifecycle).
