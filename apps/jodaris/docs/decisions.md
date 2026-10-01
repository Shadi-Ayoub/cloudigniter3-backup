# Project decisions

## 2026-09-30 / Initial JODARIS project setup

Status: initialization package prepared; local installation still requires running the installer.

- Keep the supplied standalone HTML and original screenshot unchanged as the starting baseline.
- Use project `AGENTS.md` + `.agents/skills/jodaris-development/SKILL.md` + focused references.
- Capture design tokens, page content, interactions, validation criteria, and a migration roadmap.
- Apply existing CloudIgniter architectural ownership when platform work begins.
- Reuse the local Graphify tool/skill when available; avoid parent Git-hook/global-agent changes.
- Generate the real JODARIS graph locally through the installed skill; do not bundle a fake graph.
- Future architecture: CloudIgniter template + Next.js + AWS services as needed. This replaces
  the earlier plan to keep JODARIS independent of the CloudIgniter implementation.
- Do not start the framework migration, add a backend, deploy, or alter DNS in this setup.
- Static releases contain `index.html` only; development instructions and references stay private.

## Pending local verification

Actual parent Git/workspace root, inherited skill configuration, installed Graphify version,
Codex skill activation, initial graph generation, and browser behavior on the user's devices.

## Future decision records

For each significant decision record date, request, alternatives considered, chosen change,
file/package ownership, validation, migration/release implications, and any rollback plan.

## Connection and delivery status

Remote Desktop Commander was confirmed installed, but its filesystem/terminal tools
were not exposed to the active chat. The delivered ZIP is a preparation package, not
a record of a completed Mac installation. Its installer performs a verified copy and
retains the downloaded originals. Initial graph generation remains pending locally.
