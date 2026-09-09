# Smart Forms

Core owns serializable Smart Form contracts through `/types`; specification/template merges, safe record mapping,
compilation, identity caching, module generation, and default user form definitions through `/lib`. UI owns
`CiSmartForm` through `/client`, React/action contracts through `/types`, and the synchronous field validator
through `/lib`. Preserve the existing Formik field exports. Do not put provider, Next.js, record, callback, or
permission state in Core definitions or generated artifacts.

The renderer accepts a compiled definition or specifications/template and per-instance data. Fixed authoritative
`coreForm` ignores all compiled/specification/template overrides. Main is a reserved first group; extensions may
place fields/rows there but cannot redefine its group properties. Merge fields/groups/buttons by name/id and rows
by id. Type objects and explicit row field arrays replace. Compile rejects duplicate/missing/wrong-group
placeholders and appends unplaced fields. Names are letter-first ASCII alphanumeric and reject prototype keys.

`ciDefineSmartForm` caches frozen plans by input identity; replace definition objects to invalidate. Published
forms import generated static plans. Core generation runs before its JavaScript build. Template `dev` and `build`
run `forms:generate`; rerun it after changing custom definitions during an active development session. The
generator only rewrites its exact generated-owned target with the expected header and does not rewrite unchanged
output. No data or executable bindings enter the artifact.

User create/edit forms are Core definitions rendered by `CiUserManagementPage`. The application seam is
`src/custom/user/smart-form.ts`, with artifacts in `src/custom/forms`. Core-managed user/administrator/Trash routes
only pass `appUserForms`. Registered extension names round-trip through same-name `profile.extensions` keys.
Assignment editing remains a domain control inside the shared form. Keep trusted mutations, Root protections,
and authorization enforcement independent from UI customization and runtime field-state hints.

Validate Core/UI tests and typechecks, generation consistency, public exports/builds, a template consumer, and
developer-guide typecheck/build. Cover scalar option values, invalid drafts, named callback failures, asynchronous
validation, pending duplicate prevention, reserved/fixed behavior, cache/data isolation, SSR determinism, and
legacy Formik compatibility. Use browser checks for keyboard, collapsed errors, mobile, dark theme, and RTL.

The usage guide is `developer-guide/docs/ui-components/smart-form.mdx`; keep its examples aligned with the public
contracts and application customization seam. The canonical Dictionary term is `Smart Form` at
`/dictionary/s#smart-form`, defined in `developer-guide/dictionary/s.mdx` and cataloged in
`developer-guide/dictionary-sidebars.ts` for navigation, viewer search, and automatic prose links.
