# Collection Ordering and Resource Recency

Use this reference when rendering chips, selectors, menus of domain values, trees, data tables, or newly created resources.

## Default ordering

- Sort user-facing unordered collections alphabetically by their displayed label. This includes removable chips, select/dropdown options, autocomplete results, and sibling nodes in a tree.
- Use locale-aware comparison and sort a copy rather than mutating caller-owned data.
- Preserve an explicitly meaningful order for workflows, lifecycle progressions, chronology, ranked priorities, action menus, breadcrumbs, and predecessor paths. Expose an opt-out such as `sortOptions: false` when a reusable component otherwise alphabetizes by default.
- Keep tree hierarchy intact: alphabetize siblings within each parent, never flatten or reorder predecessor relationships.

## Data tables

- `CiDataTable` defaults to descending creation date when it has a `createdAt`, `created`, or `creationDate` column. An explicit `sorting.initial`, including an empty array, overrides the default.
- Select-based table-filter options are alphabetized unless their definition sets `sortOptions: false` for semantic order.
- Provider-backed sources receive the same default sorting query and remain responsible for applying it authoritatively.

## Page-header banners

- Treat header chips as concise context, not as a restatement of permissions. Do not add generic `Management enabled` or `Read only` chips; action availability already communicates capability.
- Every chip in a page-header banner must include a recognizable icon and a filled semantic background (`default`, `secondary`, or another semantic surface). Avoid outline-only, text-only chips in this location.
- Prefer stable facts such as record count, provider, lifecycle context, or development-seeder availability. Keep provider identity in the banner instead of repeating the same chip in every table row.

## Newly created resources

- Use `CiNewResourceBadge` for recently created resources rather than page-local badge markup or timers.
- Use Core's `CI_DEFAULT_NEW_RESOURCE_BADGE_DURATION_MS` unless the product requirement explicitly supplies another duration. Evaluate recency with `ciIsNewResource` in non-UI code.
- The badge must disappear automatically at expiry and must not derive time during server rendering. Initialize hydration-stable markup and evaluate the browser clock after hydration.
- `CiDataTable` places the badge beside the first data value when the row exposes `createdAt`; disable or customize its timestamp resolver through `config.newResourceBadge` only when necessary.
