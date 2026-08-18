# CiDataTable Management-Page Interaction Standard

Use this reference for every CloudIgniter page built around `CiDataTable`. The objective is consistent behavior
across users, tenants, roles, assignments, audit records, provider resources, and future management pages.

## Ownership and composition

- Keep reusable table primitives, action layout, feedback components, and presentation behavior in
  `packages/ui`.
- Keep Next.js refresh orchestration in `packages/next` and trusted mutations in the server/application adapter.
- Keep `apps/template` limited to page composition, authoritative options, and application callbacks.
- Use `ciDefineDataTable()` and separate data/source, definition, and configuration. Do not build page-local
  table clones or duplicate action renderers.
- Supply `getRowId` from a stable domain identifier. Never use an array index for mutable, selectable, or
  provider-backed records.

## Columns and empty results

- Define concise, stable headings with meaningful plain-text labels for table, cards, compact, and export views.
- Keep the semantic header rendered when there are zero rows. Render empty content as one full-width body cell
  beneath the headings; never conditionally remove the table or compress headings into the corner.
- Distinguish an empty dataset from filtered-out results in the message. When filters are active, offer a clear
  way to reset them when the surrounding page owns that operation.
- Use semantic status badges and icons where they improve scanning. Do not rely on color alone, and use theme
  tokens rather than raw palette values.
- Use truncation only with a way to inspect the complete value. Keep the information control first when a row
  needs richer details.
- Use the shared record-information dialog for dialog-mode information controls. It keeps Description, nested
  label/value Details, and formatted JSON as three keyboard-accessible tabs. Select Description initially only
  when it contains meaningful content; otherwise disable that tab and select Details.
- Let the dialog derive its record from the row by default. Use the `record` projection to remove fields that
  should not be displayed or to improve the inspection shape; keep custom `content` for concise tooltip mode.

## Loading and refresh behavior

- Preserve the current rows, column widths, headings, and table dimensions during a load or refresh. Do not
  clear data merely to indicate pending work.
- Pass parent mutations and route refreshes through `loading`. `CiDataTable` must cover only its active data
  surface with the standard backdrop, spinner, and a short `role="status"` message while keeping the surrounding
  page usable.
- Use specific localized copy such as `Loading roles. Please wait...`; avoid an unexplained spinner.
- A form or editor mutation uses its own contained backdrop and message. Do not let a table overlay obscure an
  unrelated dialog or the whole page.
- Disable repeat submission and dismissal while a mutation is pending. Refresh data only after the mutation
  succeeds, and keep error context available when it fails.
- Provider mode must abort stale requests, reset paging when query criteria change, and avoid flashing a false
  empty state between requests.

## Row actions and alignment

- Choose action order once and preserve it for every row. Information is first; the most common safe action may
  remain inline; secondary, conditional, and destructive actions belong in overflow when density requires it.
- Use `hideWhen` when an action must not be offered for a record and `disableWhen` when it should remain visible
  and discoverable but unavailable.
- Set `rowActions.reserveSpace: true` when action visibility differs by row. The shared renderer reserves
  non-interactive slots so labels and controls align without showing misleading disabled icons.
- Do not add fake disabled menu buttons solely for alignment. Use the table's reserved-space behavior.
- Use Lucide icons already present in the project. Icon-only controls require the action label as their
  accessible name and tooltip.
- Keep controls at least 44 by 44 CSS pixels, keyboard reachable, focus-visible, and ordered correctly in LTR
  and RTL layouts.
- Use selection and global actions for genuinely repetitive bulk work rather than forcing administrators to
  repeat the same row action many times.

## Mutation feedback

- Every mutation has visible pending, success, and failure feedback. Never make a successful or failed action
  silent.
- Use `CiAlert` for page-level outcomes. Choose `success`, `error`, `warning`, `info`, or `critical` by meaning;
  success automatically uses the theme's green semantic tokens.
- Alerts are dismissible by default. Set `dismissible={false}` only for information that must remain visible,
  and use controlled visibility when the page owns alert lifecycle.
- Place outcome feedback close to the table and use concise titles and actionable descriptions. Normalize
  thrown client errors through the shared error helper.
- After a successful create or update, ensure the resulting record remains discoverable. Reset incompatible
  paging/search/filter state or deliberately disable filter persistence when restored filters could make the
  saved record appear missing.

## Confirmation dialogs

- Never use `window.alert`, `window.confirm`, or `window.prompt` for management-table mutations.
- Use `CiAlertDialog` before destructive, security-sensitive, or high-impact reversible actions.
- Name the target and action precisely, explain the consequence, and use an explicit confirm label such as
  `Delete role`, `Suspend role`, or `Restore role` instead of `OK`.
- Use the destructive variant for deletion and access-removing changes; use warning/default variants according
  to risk. Require a reason when the server records audit or incident metadata.
- Show the pending label and spinner, block repeat confirmation and dismissal while pending, keep the dialog
  open on failure when correction or retry is useful, and route the error to `CiAlert`.

## Filters, persistence, and responsive formats

- Put a filter in one intentional location. Do not duplicate the same filter in both the toolbar and column
  header.
- Treat persisted filter, format, page-size, and width preferences as UX state, never authoritative data.
- Version persistence keys after incompatible definition changes. Do not persist application records or
  sensitive values in table preferences.
- Verify table, compact, and card formats when exposed. All formats must preserve information, action
  availability, loading, empty, error, selection, and accessibility semantics.
- Validate narrow widths, long labels, zoom, dark mode, keyboard navigation, and RTL where supported.

## Completion checklist

- Headers remain readable with no rows and during refresh.
- Empty and filtered-empty messages are accurate and useful.
- Loading overlays only the relevant surface and includes readable status text.
- Stable row IDs, action order, and reserved alignment are configured.
- Icon-only actions have names, tooltips, focus treatment, and 44-pixel targets.
- Dialog-mode information uses the shared three-view record dialog, preserves nested indentation, and does not
  expose unnecessary row fields.
- Destructive/high-impact actions use `CiAlertDialog`, never a native browser dialog.
- Mutations expose pending, success, and error states through shared feedback.
- Successful mutations do not appear to lose the created or updated record because of stale filters or paging.
- Table, compact, cards, dark mode, keyboard, responsive, and RTL behavior are reviewed as applicable.
- Owning package tests/typechecks and at least one consuming page are validated.
