# Interaction and accessibility reference

Source: the current inline script and semantic HTML in `index.html`. This is an inventory
and regression checklist, not a claim that every browser/assistive technology was tested.

## Header and navigation

Desktop navigation uses section anchors. Mobile navigation has a button with
`aria-expanded` and `aria-controls`. Escape, selecting a link, outside interaction,
and returning to desktop width close the mobile navigation. Keep focus behavior and
mobile CSS/JavaScript thresholds consistent. Preserve the skip link and section IDs.

## Connected-core visualization

The hero combines an `aria-hidden` canvas, SVG linework, and readable discipline labels.
Pointer response is for fine pointers. Motion state observes reduced-motion preference
and user pause control. Keep animation, resizing, visibility, and intersection handling
coherent; do not create duplicate animation loops during future React mounts.

The scene is decorative: business content and contact paths must remain usable if canvas
rendering, animation, or JavaScript is unavailable. Keep visible motion controls accurate.

## Capability cards and dialogs

Four cards map `data-capability` to the `capabilities` object. Opening a card populates
its title, description, and detail list, then opens the native dialog. The next CTA opens
the conversation dialog and carries over the selected discipline. Keep Escape/close/
outside-click behavior, focus return, dialog labels, and body scroll state correct.

Use safe text insertion, not unsanitized HTML from form fields or external content.
Do not break the mapping when renaming a discipline or changing IDs.

## Approach tabs

Discover, Define, Build, and Evolve are a tablist, four tabs, and four panels. Maintain
`aria-selected`, `aria-controls`, `aria-labelledby`, active `tabindex`, and hidden state.
ArrowLeft/ArrowRight/Home/End navigation is part of the behavior. Panel content is
available as readable HTML rather than being fetched only after interaction.

## Contact and draft flow

The site exposes a mailto link and email-copy control. The dialog collects the existing
fields, validates them, and prepares a draft; it does not submit to an API. Preserve
URL encoding and field limits. Never evaluate or render user-supplied markup as HTML.

The draft-ready panel and copy control provide a fallback if an email application does
not open. Clipboard operations must handle rejection/unavailability without displaying
a false success. When contact copy changes, keep labels, visible email, draft destination,
and no-JavaScript mailto links aligned. See `content-inventory.json` for field details.

## Progressive enhancement

Content starts readable. Scroll-reveal styling is activated only when its observer is
ready. Reduced-motion preferences disable unnecessary movement. No-JavaScript behavior
must leave useful content and a contact link rather than an invisible or blocked page.
Do not hide entire sections until an animation completes.

## Future Next.js implementation

Treat the scene, mobile navigation, tabs, dialogs, and draft controls as candidate client
components. Keep content/page composition server-rendered where supported by the actual
template. Add effects cleanup for requestAnimationFrame, observers, subscriptions, and
event listeners. Avoid hydration-dependent hiding and whole-page `use client` as a shortcut.
Reuse existing CloudIgniter UI primitives where they preserve the behavior and identity.

## Verification

Keyboard-test all controls and dialogs; verify focus stays meaningful. Test motion
preference changes and pause/resume. Check no horizontal scrolling, text clipping,
blocked body scrolling after closing dialogs, duplicated events, or console errors.
Inspect on touch/coarse-pointer devices and with JavaScript disabled. Follow the full
matrix in `quality-checks.md` and record what was actually tested.
