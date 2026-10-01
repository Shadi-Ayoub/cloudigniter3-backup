# Website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

### Installation

```
$ pnpm install
```

### Local Development

```
$ pnpm start
```

This command starts the guide at `http://localhost:3010`. Follow the repository's
guide-authoring workflow: stop Docusaurus before editing, keep it stopped during
date updates and validation, then restart it with `pnpm start --no-open`.

### Documentation theme

The guide adapts the typography and reading layout of
[Changesets](https://changesets.dev/guide/getting-started) within the existing
Docusaurus theme. Shared tokens and documentation styles live in
`src/css/custom.css`; the homepage uses CSS modules.

- Navbar brand: **CloudIgniter Docs**, with a muted `Docs` token and a single
  8px logo-to-title gap, following the GitHub Docs wordmark layout. The navbar's
  logo component is shared with the mobile menu, with an accessible name retained
  when the compact layout hides the title.
- Logos: the color mark is retained in light mode; `static/img/logo-dark.svg`
  reuses the outline geometry from `packages/ui/src/client/components/mark/CiDevBeaconIcon.tsx`
  for dark mode. Both assets have the original 17:13 aspect ratio, so their rendered
  width and height match. The outline retains the wide cloud and flat base.
  `navbar.logo.srcDark` selects it through Docusaurus's themed image.
- Navbar tools: Dictionary Viewer precedes Dictionary. It shares the search
  control's 36px height token; touch controls retain a 44px target.
- Body: locally hosted Inter, 16px with a 28px line height.
- Headings: locally hosted Averia Serif Libre; 32px page titles, 28px section
  headings, and 20px subsections. Mobile page titles use 28px.
- Layout: a 272px desktop sidebar and a reading column capped at 688px.
- Colors: blue accents, neutral surfaces, and corresponding dark-mode tokens.
- Fonts and their SIL Open Font Licenses live in `static/fonts`. Inter's Latin
  variable subset comes from the reference site's font asset; Averia Serif Libre
  comes from Fontsource. No third-party font requests are needed at runtime.

Keep native Docusaurus navigation, keyboard controls, code copying, and mobile
menus intact. Check light/dark and desktop/mobile views after changing the theme.

### Build

```
$ pnpm build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Deployment

The configured production/canonical host is `https://docs.cloudigniter.io` for
the upcoming docs site. Navbar home links stay relative to this guide. Setting
this URL does not provision DNS or publish the site.

Using SSH:

```
$ USE_SSH=true pnpm deploy
```

Not using SSH:

```
$ GIT_USER=<Your GitHub username> pnpm deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.

### Guide media viewer

The root-mounted `src/components/MediaViewer` adds click/Enter enlargement to
Markdown images, `ImageWrapper` images and Mermaid SVG diagrams across guide
surfaces. Its native dialog offers zoom, fit, pointer dragging, arrow-key panning,
Escape dismissal and focus return, with shared light/dark tokens. No page imports
are needed. Place `data-media-zoom="off"` on a container only to opt out decorative
media. Keep diagrams as SVG for sharp enlargement.

Company publishing guidance is organized under `company-developers/publishing`.
The overview preserves `/company-developers/tooling/github-npm-publishing`.
Internal toolkit terminology belongs in the Developer Dictionary and Developer guide;
the user Dictionary retains application-facing concepts.

### Command reference, search, and feedback

**CloudIgniter Commands** is the fourth guide tab, after API Reference. Its `commands`
docs plugin owns separate `ci Commands` and `dev commands` A–Z catalogs and an MDX
manual for every executable command. Edit the manuals alongside CLI changes;
`guide:check` checks command coverage against the executable catalogs. New command
pages participate in the normal page-date registry.

`plugins/remark-command-references.ts` automatically links fully qualified command
mentions to those manuals across the Users, Developers, API Reference, Commands,
Dictionary, and rendered Skills sections. It runs before Dictionary linking and
preserves inline-code styling, headings, tables, and existing links. Shell code
blocks keep their exact executable text, with deduplicated command-reference links
below them. A command's own page does not link back to itself. The catalog comes
from command-page titles, so new manuals participate automatically. Use the full
`ci …` or `dev …` spelling in prose; generic words such as `dev`, `test`, or `build`
are deliberately not treated as command names. Run `pnpm test:command-references`
after changing the transform.

The compact navbar search button opens `src/components/GuideSearchModal` on every
guide. **⌘K** on macOS or **Ctrl+K** elsewhere opens/closes the same dialog. Its
live results support arrow-key selection, Enter to open, Escape to close, native
focus containment, and focus return. The shortcut badge follows the reader's
platform; narrow screens retain the compact Search button.

`plugins/guide-search.ts` indexes published docs using their actual Docusaurus
permalinks, including custom slugs. **Dictionary pages are excluded from the
index and guide filters**; the Dictionary Viewer retains its separate term search.
The index loads when the search modal first opens or the `/search` route loads.
Search matches all query terms across titles, headings, descriptions, prose, and
code, ranks exact command titles first, and shows highlighted excerpts, guide
filters, result counts, and loading/error/empty states. The modal displays the
first 20 matches with a link to all results. The full results page supports
incremental results and stores query/scope in the URL for sharing and browser
navigation. Both surfaces share ranking and highlighting. Search runs locally
without an external search service. Run `pnpm test:search` to check ranking,
scope, flags, empty input, and Dictionary exclusion during index generation.

`DocFeedback` is shared by article and generated-category footers, except the
Dictionary. Yes and No show an alert that explicitly says feedback was not saved.
It is currently available to all readers. Replace its handler with the host's
feedback integration when storage and identity rules are decided.

The Developer guide and dev command pages remain visible in this standalone
preview. Search records carry `public` or `developer` audience metadata; the dev
sidebar also has an audience marker. These are classification only, not access
control. When integrating with cloudigniter.io, enforce authorization in the host
and protect developer documents and search-index delivery together, as well as
navigation. Hiding links alone cannot protect a statically shipped document or
search record. Decide whether public feedback remains anonymous at that point;
the alert-only preview does not require authentication.

### Two dictionaries and the future Docs editions

The blue user **Dictionary** remains at `/dictionary`. The green **Developer
Dictionary** at `/developer-dictionary` covers company-only terminology and the
technologies used to maintain CloudIgniter. Both have navbar viewer controls,
alphabet browsing, search, and full-page links. Compact desktop navigation keeps
both viewer icons and puts full-page access in the viewer and footer. One shared dialog implementation
renders the same MDX used by the full pages, with a separate catalog per audience.

`dictionary-terms.ts` and `developer-dictionary-terms.ts` own the term
catalogs. Letter content lives in `dictionary/` and `developer-dictionary/`;
register new letter imports in `src/components/DictionaryViewer/dictionaries.ts`.
`dictionary-catalog.ts` shares sorting and sidebar construction. Contributor pages
and dev command manuals auto-link internal terms; public pages use only the user
catalog. Both dictionaries are excluded from general search and feedback and
included in page dates. Run `pnpm test:dictionary` when changing this behavior.

The planned Users edition is the default; the Developers edition extends it.
This phase keeps both tools in the existing maintainer preview. The preview
ships developer routes, catalogs, and lazy definition chunks without access
control. Audience metadata is classification only. The later publishing strategy
must exclude all internal content/assets from public output and protect delivery
of the developer edition. See `company-developers/documentation/dictionaries.mdx`.
