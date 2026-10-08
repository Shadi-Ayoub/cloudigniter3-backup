# CloudIgniter Docs

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
- Navbar tools: one **Dictionary** dropdown contains the user and Developer Dictionary
  rows. Each row pairs a viewer icon with a full-page link; viewer controls have a
  44px target in desktop and mobile menus.
- Body: locally hosted Inter, 16px with a 28px line height.
- Headings: locally hosted Averia Serif Libre; 32px page titles, 28px section
  headings, and 20px subsections. Mobile page titles use 28px.
- Layout: an animated, closed-by-default navigation drawer sized to its widest
  single-line label and a reading column capped at 688px.
- Colors: blue accents, neutral surfaces, and corresponding dark-mode tokens.
- Fonts and their SIL Open Font Licenses live in `static/fonts`. Inter's Latin
  variable subset comes from the reference site's font asset; Averia Serif Libre
  comes from Fontsource. No third-party font requests are needed at runtime.

Keep native Docusaurus navigation, keyboard controls, code copying, and mobile
menus intact. Check light/dark and desktop/mobile views after changing the theme.

The sticky **Navigation** button opens and closes the drawer on every docs route,
including on mobile. Choosing a linked title, clicking outside, or pressing Escape
closes it. Category carets expand their children without dismissing navigation.
Drawer labels use concise `sidebar_label` frontmatter; page titles and URLs stay
independent. The drawer measures all labels, including collapsed children, so
expansion does not change its width. On narrow screens its width is bounded by the
viewport and unusually long reference names can scroll inside the drawer.

**Full screen** opens the current page in element fullscreen where supported,
with an equivalent reading view as a fallback. The view hides breadcrumbs, keeps
reading controls, **On this page**, and the bottom **Previous / Next** links available,
and retains readable line lengths and the reader's article position. After scrolling
more than 300 pixels in full screen, the **Scroll back to top** arrow returns the
reading view to the top while keeping full screen active. It scrolls smoothly unless
the reader prefers reduced motion. **Exit full screen** or Escape
restores ordinary reading at the position reached in the fullscreen view. Choosing
another page from the drawer or the Previous / Next links keeps full screen active, closes the drawer, and starts
the new page at the top with its learning sections collapsed. External page controls become inert while the
reading view is open; existing Dictionary, search, and media dialogs keep their
own dismissal behavior.

### Tutorial learning sections

Active Users and Developers lessons declare `learning` in frontmatter:

```yaml
learning:
  prerequisites:
    - topic: GitHub branches and pull requests
      href: https://docs.github.com/en/get-started/using-github/github-flow
  questions:
    - question: Why must delivery retain the reviewed head and the merged commit?
      answer: Review approves the exact PR head, while delivery validates the resulting merged commit. Retain both to connect the approval to the delivered source.
```

The shared article theme puts **Prerequisite knowledge** directly after either a
Markdown or frontmatter title and **Review Questions** at the end of the content,
before the Updated footer. Both start collapsed and reset on page navigation.
Each question includes a **See answer** disclosure containing its authored key
answer. Answers start collapsed, open independently, support keyboard activation,
and reset on page navigation. On wider screens, **On this page** stays visible on
the right in full screen; smaller screens retain its collapsible inline control.
Use actual prerequisite reading links and questions with accurate key answers specific to that lesson;
avoid repeating questions from other pages. Mark path indexes and summaries with
`learning: false`. API contracts, command manuals, dictionaries, historical pages,
and rendered agent Skills are reference surfaces, rather than Academy tutorials.
`guide:check` validates all current Users and Developers pages, their prerequisite
destinations, explicit exclusions, question uniqueness, and required key answers.

### Build

```
$ pnpm build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Deployment

The configured production/canonical host is `https://docs.cloudigniter.io` for
the upcoming docs site. Navbar home links stay relative to this guide. Setting
this URL does not provision DNS or publish the site.

The source repository is `cloudigniter-io/cloudigniter-docs`; reviewed build
artifacts target `cloudigniter-io/build-cloudigniter-docs`. Follow the
[website publishing workflow](company-developers/publishing/websites.mdx) for
review requests and AWS hosting. Docusaurus's generic `deploy` command is not the
CloudIgniter publishing workflow.

The starter blog is disabled and its sample posts are removed. **Resources**
contains the maintained Skills documentation.

### Guide media viewer

Image captions use semantic `figure`/`figcaption` markup and shared styles in
`src/css/custom.css`: 14px italic secondary text on a subtle themed surface, with
a 6px image-to-caption gap and a fine logical-start border. `ImageWrapper` uses
the same treatment. Keep captions inside their figure instead of placing them
in an ordinary body paragraph; avoid page-specific caption styles.

The root-mounted `src/components/MediaViewer` adds click/Enter enlargement to
Markdown images, `ImageWrapper` images and Mermaid SVG diagrams across guide
surfaces. Its native dialog offers zoom, fit, pointer dragging, arrow-key panning,
Escape dismissal and keyboard focus return, with shared light/dark tokens. Opening
the viewer blurs its source image; pointer-opened images remain unfocused after
closing, while keyboard activation restores focus to the source. No page imports
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
technologies used to maintain CloudIgniter. Both have viewer controls and full-page links
in the navbar's **Dictionary** dropdown, plus alphabet browsing and search. The mobile
menu uses the same two rows. One shared dialog implementation
renders the same MDX used by the full pages, with a separate catalog per audience.
While either viewer is open, the background page stays at its scroll position.
The term list and definition scroll independently; closing or navigating restores
the page's previous scrolling styles and scrollbar gutter.

`dictionary-terms.ts` and `developer-dictionary-terms.ts` own the term
catalogs. Letter content lives in `dictionary/` and `developer-dictionary/`;
register new letter imports in `src/components/DictionaryViewer/dictionaries.ts`.
`dictionary-catalog.ts` shares sorting and sidebar construction. Contributor pages
and dev command manuals auto-link internal terms; public pages use only the user
catalog. Both dictionaries are excluded from general search and feedback and
included in page dates. Run `pnpm test:dictionary` when changing this behavior.

Dictionary links must match the term's meaning in context. Catalog entries can
use a fourth tuple item, `{ autoLinkLabel: false }`, to keep ambiguous bare labels
searchable without automatically linking them. Qualified aliases still link;
authors can explicitly link a bare term when its technical meaning is clear.
Claim uses this policy so publishing assertions do not open token definitions.
Layout also requires a qualified UI/route alias or an explicit contextual link;
Package Layout has its own Developer Dictionary definition for folder structure.
CI means Continuous Integration, and CI/CD has a separate definition. These
abbreviations match case-sensitively to preserve the lowercase `ci` executable.
Write the platform's name as CloudIgniter; preserve literal public identifiers,
commands, historical import paths, and persisted `CI#` key syntax.

The planned Users edition is the default; the Developers edition extends it.
This phase keeps both tools in the existing maintainer preview. The preview
ships developer routes, catalogs, and lazy definition chunks without access
control. Audience metadata is classification only. The later publishing strategy
must exclude all internal content/assets from public output and protect delivery
of the developer edition. See `company-developers/documentation/dictionaries.mdx`.
