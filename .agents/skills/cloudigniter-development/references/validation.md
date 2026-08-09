# Validation and Final Review

Use this reference before completing a non-trivial CloudIgniter change.

## Select validation by scope

Consider:

- focused unit or integration tests;
- TypeScript checks for every changed package;
- package lint/style checks;
- package builds;
- application typecheck/build;
- targeted runtime requests;
- package dry-run validation;
- client/server boundary scans;
- module validation;
- Graphify update.

When a public package API changes, validate the owner and at least one consumer. For EmberGuard work, validate the affected portion of:

```text
emberguard → core → next → provider → apps/template
```

For request-lifecycle or i18n work, validate the affected portion of:

```text
next.config.ts → proxy → context transport → request.ts → messages → provider/component
```

## Request lifecycle checks

- Does the proxy matcher include every application route that requires context?
- Are internal/static/API exclusions intentional?
- Is tenant/org-unit resolution performed before logical route matching?
- Can `route: null` reach a registered application page unexpectedly?
- Is the same-request header injected after route resolution?
- Are caller-supplied context headers removed before authoritative injection?
- Is cookie transport required, minimal, size-safe, and correlated with a pathname?
- Do redirects account for the loss of forwarded request headers?
- Does next-intl still point to the intended request configuration file?
- Does the route namespace load the expected message file chain?
- Are application overrides merged after core messages?

## Architectural diff review

Check:

- reusable logic did not remain in the template;
- every public type has the correct owner and `/types` export;
- public helpers use the correct `/client`, `/server`, or `/lib` entry point;
- generic EmberGuard APIs remain behind `core`;
- provider-specific behavior did not leak into generic packages;
- no package imports from `apps/template`;
- no accidental deep imports or duplicate abstractions;
- no client/server boundary was crossed;
- request context remains request-specific and minimal;
- compatibility impact is understood and documented.

## Baseline failures

If a broad repository check fails:

1. Record the command and failure.
2. Determine whether any failure references changed code.
3. Run narrower checks that can validate the changed scope.
4. Do not claim the broad check passed.
5. Report unrelated baseline blockers separately from change-related failures.

## Completion report

Include ownership, affected lifecycle stages, public API, template impact, compatibility, validation performed, and any known unrelated blocker.
