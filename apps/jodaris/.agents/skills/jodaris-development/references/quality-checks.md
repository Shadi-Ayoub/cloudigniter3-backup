# Quality and release checks

## Static checks

```bash
node scripts/check.mjs
```

Requires Node.js 18+ and no package installation. Checks required project files, inline
JavaScript syntax, duplicate IDs, anchor/ARIA references, four discipline/tab counts,
metadata, initial single-file dependency policy, and parseability of reference JSON.
This is a focused regression check, not a standards validator or full security audit.

To verify that the two supplied assets still exactly match their original baseline:

```bash
node scripts/check.mjs --baseline
```

A later intentional edit will change the hash. Do not overwrite the original manifest
merely to conceal a change; document the new baseline deliberately.

## Local browser preview

```bash
bash scripts/preview.sh
```

Requires Python 3. It prepares `dist/index.html` and serves only that public folder on
`127.0.0.1:4173`. Stop with Ctrl+C. Set `PORT=4174` to select another local port.
Do not serve the whole repository on a public interface.

## Browser matrix

Test current desktop Chromium and Safari locally when available; test touch behavior
on a mobile browser rather than treating a desktop resize as complete device coverage.
Use widths of 1440, 1024, 820, 640, 390, and 320 CSS pixels. Check 200% zoom and long text.
Check console errors, failed requests, clipping, horizontal overflow, card balance,
readable body text, sticky-header offsets, and form usability.

Test every navigation anchor; mobile toggle/outside/Escape/resize closure; all four
capability dialogs; discipline carryover to the contact form; all approach tabs and
arrow/Home/End operation; native validation and draft creation; email and message copy;
dialog Escape/close/backdrop/focus return; motion pause/resume; reduced motion; tab-hidden
animation behavior; back-to-top; and a useful JavaScript-disabled page/contact link.
Verify no fake “sent” feedback or unexpected network submission.

## Release

```bash
bash scripts/prepare-static-deploy.sh
```

Only `dist/index.html` is created as the public artifact. Upload **the contents of `dist/`**
into the website root for the current static release. The screenshot is a design reference,
not required by this single-file page. Never upload the entire development package.
Check the deployed HTTPS page and visible contact address. Retain a rollback copy before
replacing a live file. This package performs no upload or production configuration.

## Documentation and graph

Update reference snapshots alongside relevant changes; log intentional baseline decisions.
Refresh the appropriate structural/semantic graph and verify a sample query. Report
actual results separately for static checks, browser checks, graph generation, and any
future cloud integration tests. A successful setup script is not proof of deployment.

## Future migration

Use the parent repository's actual dependency versions and check scripts. Validate
TypeScript, lint, tests, affected package/application builds, server/client boundaries,
metadata/routing, secrets handling, and any activated services. Do not use remembered
Next.js/AWS defaults instead of inspecting the live template and current documentation.
