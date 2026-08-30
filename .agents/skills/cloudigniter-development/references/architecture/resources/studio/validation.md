# Resource Studio Validation

Use this reference after applying [data entities and generation](data-entities-and-generation.md), [transactions](transactions.md), and [deployment and security](deployment-and-security.md).

## 12. Validate the complete V1 path

Run proportional package and consumer checks, including:

- AWS descriptor, scalar/default/validation, authorization, index, schema, warning, and collision tests;
- Next.js scoped paths, protected route metadata, server scope/key reconstruction, serializable CRUD/list results, and manager generation tests;
- UI field conversion plus `CiDataEntityManager`/`CiDataTable` interaction tests;
- CLI create, update, drop, reservation, ownership, generated drift, unsafe path, and symlink tests;
- versioned planner/output migration tests proving that a known prior plan accepts the expected absence of newly introduced artifacts, generates them, and still rejects an existing unowned target;
- exact transaction restoration of bytes, modes, created/deleted files and directories, LIFO undo, and all-or-nothing rollback drift tests;
- loopback, Host, bootstrap expiry/single use, fixed session expiry, Origin, CSRF, request-size, and security-header tests;
- plan-hash and deployment-intent binding, expiry, single use, SSO re-verification, Region precedence/drift/pinning, Node guard, and log-redaction tests, including complete, unterminated, and chunk-split PEM input;
- a real `Book` fixture that generates backend/frontend artifacts and proves drop plus exact local undo without contacting AWS;
- strict route/schema composition, package typechecks and exports, a template consumer check, CLI `npm pack --dry-run`, documentation checks, `git diff --check`, and `graphify update .`.

For AppleDouble cleanup, test at least:

- a pre-existing valid `._*` file remains byte-for-byte unchanged;
- a newly created, manifest-derived, provenance-journaled regular AppleDouble companion is removed by exact path;
- a newly observed `._*` outside the manifest is preserved;
- a regular `._*` file with the wrong or truncated magic is preserved;
- a symlink, directory, socket, changed-after-snapshot candidate, and provenance-journal mismatch are preserved and warned;
- a missing/incomplete pre-snapshot or journal and a companion beside a failed output write are preserved and warned;
- a crash-recovery candidate with a changed, corrupt, reused, or mismatched journal is preserved and warned;
- a pre-existing sidecar is excluded from transaction ownership and is allowed to block empty-directory removal without being deleted;
- proven current-operation sidecars are cleaned before empty-directory removal, including create, update, drop, undo, and failed-operation recovery;
- filenames with spaces, Unicode, and leading punctuation are handled without shell expansion;
- partial inspection or unlink failure reports exact warnings and does not trigger broader cleanup;
- repeated cleanup is idempotent and never adopts a pre-existing artifact.

Do not contact AWS in ordinary tests. If a broad repository check has baseline failures, separate them from change-related failures and report both accurately.

## 13. Keep V1 exclusions explicit

Do not expand V1 to:

- attach to an arbitrary existing or shared DynamoDB table;
- modify a hand-written or CloudIgniter core model;
- generate CRUD Lambda functions when native Amplify Data operations suffice;
- generate the Lambda needed by `custom` authorization;
- generate EmberGuard resources or policies;
- provide a production deployment workflow;
- expose a `ci-dev` generator;
- claim exact cloud-resource or Data Record rollback.

Treat any exclusion change as a separately designed versioned capability with ownership, migration, security, cost, and compatibility review.

## Broader validation

Also complete the repository-wide [validation and final review](../../../authoring/validation.md).
