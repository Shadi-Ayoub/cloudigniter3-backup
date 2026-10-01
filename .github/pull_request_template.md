## Behavior and ownership

Describe the observable change and owning package. Link the issue and Changeset when a release is needed.

## TDD evidence

- Red: command and expected behavioral failure observed before implementation.
- Green: command and passing result after the smallest implementation.
- Refactor: what changed while keeping tests green.
- Cases: success, invalid input, denied access, provider failure, runtime/public API compatibility as applicable.

## Validation

- [ ] `pnpm quality:next` passes when Next or its dependencies change.
- [ ] `pnpm release:check:next` passes for a Next release candidate.
- [ ] Coverage exceptions were not expanded or rehashed to bypass the new/changed-file thresholds.
- [ ] No required tests are skipped, TODO, or hidden behind an exclusive selector.
- [ ] Affected skill references and CloudIgniter Developers guidance are current.
- [ ] Release review references the CI run, commit, version, tarball and SHA-256.

A green build permits a publish request. Publishing requires a separate maintainer decision for the exact verified artifact.
