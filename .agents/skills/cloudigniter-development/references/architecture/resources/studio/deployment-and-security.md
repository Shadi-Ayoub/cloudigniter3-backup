# Resource Studio Deployment and Security

Use this reference for explicit AWS deployment authorization, SSO/STS verification, Studio browser/server security, secret redaction, and provenance-safe AppleDouble handling.

## 9. Separate generation from deployment and SSO

Keep create, update, drop, and undo offline. Never start Amplify because a local form was submitted.

For deployment:

1. Require an explicit AWS profile and valid 1–15 character sandbox identifier.
2. Verify that generated-owned files match the deterministic plan and hash the sorted path/content plan.
3. Run STS and resolve Region from `AWS_REGION`, then `AWS_DEFAULT_REGION`, then the selected profile; fail when none exists.
4. Issue a 10-minute, single-use, in-memory intent bound to plan hash, profile, identifier, account, ARN, user ID, and Region.
5. Show the exact verified target before an interactive deployment.
6. Consume the intent, rebuild and hash the plan, repeat STS and Region resolution, and reject every mismatch or expiry before spawning Amplify.
7. Pin the verified Region as both `AWS_REGION` and `AWS_DEFAULT_REGION` and run one `ampx sandbox --once` process.

After `aws sso login`, automatically repeat STS/Region verification and issue a fresh intent; login success alone never authorizes deployment. Make `ci amplify sandbox deploy --profile=... --identifier=... --no-interactive` use the same verification runtime. Support deployment only on Node.js 22 and 24 in V1 while leaving offline editing available under other runtimes.

## 10. Defend the local Studio boundary

Bind only to `127.0.0.1` and reject non-loopback clients and unexpected hosts. Use a one-use five-minute bootstrap token in the URL fragment, exchange it for an `HttpOnly`, `SameSite=Strict` session with a fixed eight-hour lifetime, and require exact Origin plus CSRF proof for mutations. Serialize mutation operations, cap JSON request bodies, and send no-store, CSP, framing, referrer, and content-type security headers. Never expose Studio through a public tunnel.

Keep settings, lifecycle logs, and journals in private ignored `.cloudigniter/local` files. Never persist AWS credentials, Studio bootstrap/session secrets, or deployment intents. Redact credential-bearing object keys and secrets embedded in strings, including authorization values, access keys, JWTs, API keys, and complete, unterminated, or chunk-split PEM blocks, before persistence. Treat redaction as defense in depth rather than permission to log sensitive payloads.

## 11. Clean macOS AppleDouble artifacts by proven provenance only

Treat every `._*` path as user-owned unless the current operation proves otherwise. A name match alone is never proof.

Apply this contract to every create, update, drop, undo, and failure-recovery path. Build the cleanup manifest as the exact union of:

- every generated file the operation will create, replace, restore, or delete;
- every directory the tool will create or later attempt to remove;
- every atomic temporary file name allocated by the operation;
- the exact machine-local writers `.cloudigniter/local/.gitignore`, `.cloudigniter/local/resource-studio/settings.json`, `.cloudigniter/local/resource-studio/lifecycle.jsonl`, and every file written below `.cloudigniter/local/resource-studio/transactions/<transaction-id>/**`;
- the separate cleanup-provenance journal file itself.

Keep this cleanup manifest and journal out of generated ownership, resource descriptors, resource transaction before/after images, and the deployment plan hash. Pre-existing sidecars are never generated targets or transaction targets. They remain user-owned and may legitimately prevent an otherwise empty directory from being removed.

Before Resource Studio or Codex creates or generates files:

1. Materialize the exact intended output manifest; do not infer it afterward from a directory walk.
2. Derive only the possible AppleDouble companion for each manifest path: for `<parent>/<name>`, the candidate is `<parent>/._<name>`.
3. Snapshot each candidate with `lstat`, recording absence or its exact path, file kind, mode, size, device/inode identity, modification time, and SHA-256 when it is a readable regular file. Preserve every existing candidate byte-for-byte.
4. Start a separate private cleanup-provenance journal for this operation. Bind the canonical application-root identity and operation ID to the exact output manifest, derived candidates, pre-snapshots, atomic temporary names, and later per-output write result. For a transaction-backed operation, use a distinct journal file below that transaction's machine-local directory rather than adding cleanup entries to its resource before/after-image journal.

If the manifest, pre-snapshot, or cleanup journal cannot be established before mutation, do not reconstruct provenance afterward and do not remove any companion. Continue only with cleanup disabled and an explicit warning, or fail the create/generate operation before it writes.

After the current mutation or recovery step, inspect only candidates derived from that same manifest. An exact candidate may be removed only when all of these conditions hold:

- it was absent in the pre-snapshot;
- the current operation successfully completed the exact declared create, replace, restore, delete, directory, or atomic-temporary-file action corresponding to that manifest entry;
- the cleanup-provenance journal binds the candidate to this operation and output;
- `lstat` shows a regular file and not a symbolic link;
- its first four bytes, read without following links, are the big-endian AppleDouble magic number `0x00051607`;
- no post-generation fact makes provenance uncertain.

Unlink each proven candidate by its exact path. Never use a glob, recursive deletion, `find -delete`, wildcard expansion, or bulk cleanup. Never delete a pre-existing candidate, a directory, symlink, socket, non-AppleDouble file, companion for an output not in the exact manifest, or any path whose provenance is incomplete. Preserve uncertain candidates byte-for-byte and emit an actionable warning. A cleanup failure must not be hidden or reclassified as successful cleanup; retain the provenance journal and report the exact candidate and reason.

Run proven sidecar cleanup before the transaction attempts to remove tool-created empty directories. After cleanup, use ordinary empty-directory removal and accept a retained pre-existing or uncertain sidecar as a reason the directory must remain. Never broaden deletion to make directory removal succeed.

For crash or failure recovery, resume only from a complete, fsynced cleanup journal whose application root, operation ID, manifest path, derived candidate, absent pre-snapshot, corresponding committed output result, and recorded candidate fingerprint all match current `lstat` state. Reject a changed, partial, corrupt, reused, or mismatched journal; preserve every candidate and warn. Mark each exact unlink durably so retry is idempotent, and never infer recovery provenance from a surviving generated file alone.

Apply the same fail-closed process to files created directly by Codex. For a CloudIgniter generator, keep the detailed cleanup policy in that tool's development reference and test its manifest/provenance adapter. Do not scan or “tidy” unrelated pre-existing `._*` files discovered nearby.

## Related references

- [Resource Studio overview](overview.md)
- [Transactions](transactions.md)
- [Validation](validation.md)
