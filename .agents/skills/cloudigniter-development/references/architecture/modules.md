# Optional modules and extension lifecycle

Read this reference for catalogue discovery, module installation, enablement, configuration, dashboard slots,
CloudFormation ownership, or the To-Do reference module. Existing `CiModuleManifest` runtime facets and dependency
tooling remain the foundation; `CiExtensionManifest` adds optional-module metadata without changing core modules.

## Ownership and discovery

- Core owns generic contracts, lifecycle transitions, fixed-module protection, configuration validation, module
  access-control contributions, and To-Do command validation. Public exports use `/lib` and `/types`.
- AWS owns registry persistence, CloudFormation operations, provider permissions, fresh EmberGuard enforcement,
  and the To-Do table/handler factory through `/server/backend` and `/types`.
  `ciAwsExtensionWriteGuard(context)` exposes the atomic registry revision condition as a transaction item;
  keep registry keys internal. Custom module writes and the To-Do factory use it in the same transaction as their
  item writes, after `assertAccess`. It performs no I/O or authorization and does not guard external side effects.
- Next owns the server-action adapter and build-time generator (`/server`, `/types`, `/tooling/modules`).
- UI owns `CiModuleManagementPage` and `CiTodoPage`; callbacks carry serializable `CiResult` envelopes.
- The management route uses `dashboard.modules`; the generic extension host uses `dashboard`. Both pages enable
  the shared Dashboard breadcrumb children menu. Next's `CiNextModuleManagementPage` supplies the management
  `modules` message group and locale through UI's `CiModuleManagementMessages` contract, keeping next-intl out
  of UI. Register `dashboard-modules.json` in both package and custom locale maps for English/Arabic; empty custom
  files preserve package defaults. Verify route-loaded messages and overrides, not just JSON file existence.
- The application owns trusted module folders at `src/custom/modules/<id>`. Preserve `manifest.ts`, `client`,
  `server`, `lib`, and `types` conventions. The example delegates reusable To-Do behavior to packages.
- `ciGenerateNextExtensionRegistry` writes only three reserved files in `src/custom/modules/.generated` using
  the shared journaled file transaction. It rejects symlinks, invalid/reserved IDs, missing facets, and manual
  target files. Runtime-neutral manifests, client components, and AWS facets use separate generated imports.
  Incompatible modules remain discoverable without loading unsupported facets.
- Discovery happens before Next dev/build and the template sandbox script. New code requires generation,
  rebuild, and backend deployment. Dashboard installation never modifies a server filesystem or runs npm hooks.
  Manifest source is trusted application code, not a sandbox for downloaded/unreviewed code.
- User-module validation loads only referenced core dependencies. Core graph validation remains a separate
  maintainer check. Accept both `satisfies CiModuleManifest` and `satisfies CiExtensionManifest`.

## Lifecycle invariants

The immutable core list is distinct from optional installations. A detected extension has no installation
record until Install. Installation transitions through `installing` to `disabled`; only explicit Enable makes
it executable. Disable preserves resources and configuration. Uninstall requires a disabled/failed installation,
exact ID confirmation, the revision reviewed by the user, and no installed dependents. It transitions through
`uninstalling`; remove the registry entry only after the provider proves deletion complete. Keep source folders.

Use one compare-and-swap registry revision to serialize lifecycle/dependency decisions. Persist the operation
ID and intended provider identity before provider calls. Network errors leave a retryable intent; reuse its
token and deterministic resource identity. Never turn a successful API submission into completed installation
or deletion. `list()` reconciles pending operations and can conditionally write status; it never provisions.
Failed stacks remain visible for cleanup. Missing code and version drift must fail closed for execution/enablement.
Updates remain a notice dialog with no version request, download, migration, or provider mutation.

Every management page/action/provider handler requires authenticated exact `developer` membership in exact
`development` mode. Ordinary module execution requires authentication, enabled matching code, and the module's
permission decision at the provider boundary. Manifest permissions contribute application-owned resources and
optional authenticated-user roles; persisted denials, suspension, and forced read-only restrictions still apply.
Never use a module's metadata declaration alone as authorization for its resources.

## AWS boundary

Amplify owns two core resolver Lambdas and a retained, non-model registry table. Optional data is held in separate
CloudFormation stacks named from a root-stack-derived environment prefix and the module ID. Persist the actual
stack ARN and outputs after describing the stack. Before deletion verify provider, account, Region, stack name,
environment/module tags, and absence of parent/root stack links. Never delete Amplify-managed parent/nested stacks.
IAM creation is limited to the compiled catalogue; cleanup remains limited to the environment prefix so orphaned
installations can be removed after their source folder disappears. The first AWS provisioning policy supports
DynamoDB tables; new resource kinds require an explicit scoped provider policy contribution, not wildcard grants.
Modules without an infrastructure template use a `none` reference and incur no optional stack provisioning.

Keep both resolver Lambdas and their policies in the Data resource group. Read the existing EmberGuard table
through `CI_ENV.CI_EMBERGUARD_ACCESS_TABLE_NAME` (whose value differs from its constant key). Do not add an
AppSync model granting direct client writes to the lifecycle registry. Uninstall extensions before deleting the
whole Amplify environment: their standalone stacks are independent and the retained registry is the recovery record.

## To-Do isolation and persistence

The reference module is a personal list, available through the system dashboard slot; it does not implement
tenant-shared tasks. Resolve the owner from the verified subject, never request input. Query only that owner's
partition, 50 items per page, reconstructing continuation keys for the current owner. Use core key builders.
No indexes, scans, streams, or replicas are required. Use on-demand Standard tables with deliberate backup policy.

Task saves combine a registry revision ConditionCheck and an optimistic task Put in one transaction. A concurrent
disable/uninstall/configuration change must reject the write. Generate timestamps, owner identity, task IDs, and
deletion metadata on the server. Task Trash is module-owned and personal; restore preserves completion status.
There is no per-task purge action. Uninstall removes the complete module table, including Trash, irreversibly.

## Application module authoring

Keep optional-module management and the following module-authoring lesson under a Modules parent page within
Extend your application. The supplied,
initially uninstalled To-Do module remains the lifecycle example; Personal note is the separate copyable authoring
example. Validate its manifest, shared schemas/types, named client export, AWS template, command handler, and
generated registry against public entry points. Do not add the tutorial module to the shipped template implicitly.
Teach generation and backend deployment before Dashboard Install. Explain host limitations: one named table
binding with scoped default DynamoDB permissions, system dashboard scope, boolean/enum installation settings,
and no automatic Store download, update, arbitrary-route registration, or provider implementation from metadata.

Validate lifecycle races/retries, stale confirmations, dependency protection, missing/version-mismatched code,
stack ownership, provider failures, IAM scope, owner isolation, pagination, configuration, read-only policy,
registry generation and runtime boundaries. Test UI flows with simulated provider callbacks before any explicitly
authorized cloud deployment. Never describe mocked provider tests as a live AWS deployment.
