# CloudIgniter DynamoDB Design and Interaction

Use this reference for every DynamoDB architecture or interaction decision. The goal is a design that is safe,
observable, and cost-effective for its measured workload, not the fewest tables or the most elaborate schema.

## Architecture default

Use one table per security and operational bounded context, then use single-table modeling for related entity
types inside that table when their access patterns benefit from co-location.

For CloudIgniter:

- keep EmberGuard authorization data in its dedicated access table;
- keep control-plane tenant and Org Unit data in a system table;
- keep user profiles behind their distinct application authorization boundary;
- separate public, private, and owner-scoped settings when their IAM exposure differs; combine them only when the
  same authorization, lifecycle, traffic, and operational controls truly apply;
- move sustained audit, event, session, or other high-volume/retention-driven workloads to a separate table or
  purpose-built store.

An EmberGuard resource domain is an authorization-catalog entity, not a database bounded context. The `CI#`
key namespace makes records traceable; it does not imply that all CloudIgniter data shares one table.

## Mandatory decision sequence

Before changing infrastructure or persistence code:

1. Inspect the active application schema, backend manifest/resource registry, provider code, IAM policies,
   indexes, and all readers and writers. Do not infer deployed architecture from a console table name alone.
2. List each required access pattern, including partition key, sort condition, result cardinality, ordering,
   consistency, pagination, and write atomicity. Include administrative and operational queries.
3. Identify the security owner, tenant boundary, data classification, retention/TTL, backup/restore, encryption,
   stream, regional, availability, and failure-isolation requirements.
4. Choose the table boundary using the rules below. Do not start from entity relationships or table-count goals.
5. Estimate the relative cost from item size and frequency for reads, writes, transactions, GSIs, storage,
   backups, streams, exports, and replicas. Include write amplification for every projected index.
6. Compare at least the chosen design with the cheapest safe alternative. Prefer the simpler design when both
   satisfy the access patterns and security requirements.
7. Verify current capacity, pricing, quotas, consistency, backup, and table-class claims in official AWS
   documentation. Do not embed remembered prices or stale limits in a decision.
8. Record the boundary, access patterns, rejected alternative, cost drivers, safety controls, migration, and
   monitoring plan in the relevant developer-guide architecture page.

Never create or mutate an AWS resource through the console as part of a code task unless the user explicitly
authorizes that external state change. Infrastructure definitions remain the source of truth.

## Combine or split

Combine related entity types in one table only when:

- the same package/capability owns them;
- they share IAM exposure, tenant-isolation rules, encryption, backup, retention, and regional requirements;
- their traffic and scaling profiles can safely share capacity and failure impact;
- co-located item collections, transactions, or shared queries materially serve known access patterns;
- streams and operational tooling can distinguish their item types safely.

Split a table when any material boundary differs:

- public versus private or privileged access;
- capability ownership or least-privilege IAM;
- encryption key, retention, TTL, backup/PITR, export, or legal/data-residency policy;
- throughput shape, hot-key risk, storage class, stream consumer, or regional replication;
- blast radius, restore unit, deployment lifecycle, or independent scaling need;
- high-volume append-only data versus latency-sensitive control-plane or authorization reads.

Do not split merely because records have different entity types. Do not combine merely to reduce the table
count. DynamoDB cost follows consumed operations, stored/indexed bytes, and optional features more directly than
the number of on-demand tables; operational overhead still increases with every table.

## Cost-effective defaults

- Start unpredictable and early-stage tables in on-demand mode. Reconsider provisioned capacity only from
  observed traffic and a documented comparison; configure auto scaling when provisioned mode is selected.
- Use the Standard table class by default. Consider Standard-IA only when measured storage is the dominant cost
  and the higher request pricing is justified.
- Add a GSI only for a named access pattern that cannot be served safely and efficiently by the base table.
  Estimate index storage and write amplification and project only required attributes.
- Prefer `GetItem`, `BatchGetItem`, or bounded `Query` operations. Never add a request-path `Scan`; administrative
  scans require pagination, explicit operational intent, and cost/throttling controls.
- Return and monitor consumed capacity during diagnostics or load tests where the abstraction supports it.
- Use projections and bounded page sizes to reduce transferred data, but remember that DynamoDB read capacity is
  based on items evaluated rather than attributes returned by a filter or projection.
- Apply TTL only for cleanup. TTL deletion is asynchronous, so application logic must enforce expiration.
- Enable PITR, streams, exports, replicas, or customer-managed keys deliberately per table; each has operational
  and potentially financial consequences.
- Set budgets, tags, alarms, and on-demand maximum throughput where appropriate to detect or contain surprises.

## Safe interaction rules

- Build every PK, SK, and secondary-index key with the public core helpers described in
  [table-keys.md](table-keys.md).
- Use condition expressions or transactions for invariants, uniqueness, optimistic concurrency, and
  multi-item atomicity. Do not implement read-then-write races.
- Make retryable writes idempotent and preserve SDK exponential-backoff behavior. Do not retry validation or
  conditional-check failures blindly.
- Paginate every multi-item query and define stable continuation-token behavior at the public boundary.
- Request strong consistency only from the base table when the correctness path requires it. GSIs and streams
  are eventually consistent and must not prove a current authorization grant or revocation.
- Keep authorization-path reads bounded and fail closed on malformed, missing, expired, or inconsistent policy
  data.
- Grant handlers the minimum table and index actions and resources. A dedicated bounded-context table does not
  justify broad wildcard access.
- Run local deployment bootstrap through a deployed, least-privilege handler or an equivalently scoped service
  boundary. Do not grant developer SSO roles direct table access merely so a workstation script can seed or
  repair application data. Prefer a handler identifier emitted through deployment outputs. When a provider
  omits that custom output, discovery may use its read-only control plane only when it proves one unique handler
  through both a stable capability token and the exact deployed table binding. Keep the handler's IAM policy and
  persistence behavior in version-controlled infrastructure and provider code.
- Avoid logging complete records, credentials, policy payloads, or personal data. Log safe table identifiers,
  operation names, key shapes/redacted IDs, request IDs, latency, throttling, and consumed capacity.
- Treat generated physical table names as deployment details. Code and policy wiring use manifest-resolved names
  and ARNs rather than hard-coded console names.

## Required validation

- Unit-test exact keys, conditions, pagination, empty results, throttling/error translation, and consistency flags.
- Test tenant isolation and least-privilege policy output, including index ARNs when queried.
- Demonstrate that request paths use bounded keys and contain no scans or unbounded fan-out.
- Check item-size and hot-partition assumptions with representative data.
- Validate the infrastructure/resource manifest and at least one real consuming handler/provider path.
- Review the diff for accidental GSIs, broad projections, streams, replicas, backup changes, or capacity changes.
- For pre-production address changes, replace readers and writers atomically and reseed disposable data. For
  retained data, require an explicit migration and rollback plan.
