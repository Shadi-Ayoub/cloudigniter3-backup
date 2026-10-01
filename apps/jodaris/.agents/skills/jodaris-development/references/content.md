# Content and positioning reference

Status: initial landing-page copy, captured 2026-09-30. Business scope comes from the
owner's brief. The existing copy is a working baseline, not proof of achievements.
`content-inventory.json` contains the current headline, section copy, card summaries,
capability-dialog details, approach outcomes, metadata, and contact fields.

## Company scope

JODARIS is a company working around **Digital Applications, Research, Innovation, and
Systems**. Preserve all four disciplines in that order. Use `JODARIS` for the brand and
`jodaris.com` for the domain. Do not invent a legal suffix or an expansion of the company
name. Do not confuse this company with the CloudIgniter product or the owner's employer.

The JODARIS site is business-facing. The CloudIgniter product site is technically focused.
The future use of CloudIgniter to power JODARIS is an architectural choice, not a reason
to replace the company message with framework documentation.

## Core messages

- Hero: **Engineering ideas into impact.**
- Hero eyebrow: **Independent thinking. Connected technology.**
- Supporting copy: “We bring digital applications, research, innovation, and systems
  together to turn ambitious ideas into purposeful technology.”
- Expertise heading: **Four disciplines. Infinite possibility.**
- Mindset: **Technology is the tool. Moving people and possibilities forward is the point.**
- Approach: **Not just built. Thought through.**
- Contact: **What’s your next big idea?**

These are brand statements, not quantified performance or success guarantees.

## Discipline boundaries

**Digital Applications:** usable web/mobile experiences, purpose-built platforms,
portals, interface design, and modernization. Avoid claiming a particular delivery
history or a currently released product unless the owner supplies evidence.

**Research:** applied technology exploration, feasibility, testing assumptions,
proofs of concept, and emerging-technology evaluation. Do not imply accredited academic
research, published results, patents, or formal institutional affiliations.

**Innovation:** product discovery, prototypes, minimum viable products, possible
AI-enabled experiences, and new ways of working. Present exploration honestly; a
prototype is not a production deployment or proof of measured benefits.

**Systems:** architecture, integration, APIs, workflow automation, and connected data.
Cloud-ready positioning does not mean an AWS deployment already exists.

## Voice

Write in clear, confident, considered language. Lead with the useful outcome and support
it with a concrete capability. Use concise paragraphs, parallel card copy, active verbs,
and purposeful headlines. Be technically credible without making visitors decode jargon.
Avoid exaggerated superlatives, vague disruption claims, artificial urgency, invented
numbers, generic AI hype, and suggestions of scale or certification without evidence.

Use the supplied English baseline. Do not add Arabic/localization until requested;
when that happens, plan proper locale content, RTL, typography, and interface parity.

## Calls to action and process

Retain a low-pressure path: explore expertise → understand the approach → start a
conversation. Existing labels include “Explore our expertise”, “How we think”,
“Let’s talk”, and “Start a conversation”. Do not imply a checkout, booked appointment,
live chat, or automatically submitted enquiry.

Process stages remain **Discover → Define → Build → Evolve**. Outcomes and descriptions
must remain aligned across tabs and panels; the JSON inventory records the baseline.

## Contact truthfulness

Current contact: `shadi@jodaris.com`. Do not replace it with `hello@`, `info@`,
`superadmin@`, or another guessed mailbox. Changing contact information means updating
all visible and fallback occurrences, metadata where applicable, and the JavaScript
fallback/body configuration.

The conversation form validates details and prepares a mailto draft. The visitor must
review and send it through their email application. “Draft ready” is appropriate;
“Message sent”, “We received your enquiry”, and promised response times are not.
Do not describe local UI memory as CRM storage or claim backend privacy guarantees.

## Publication safeguards

Never add unverified client names/logos, testimonials, awards, accreditations, statistics,
partner status, office locations, founder biography, service-level guarantees, or legal
policies presented as reviewed. Do not repurpose ATS/IAT institutional achievements as
JODARIS company credentials. Future architecture decisions belong in project references,
not as current operational claims on the live site.

When copy changes, edit `index.html` and the matching inventory together. Review browser
line wrapping, card balance, dialog text, labels, and metadata. The JSON is not connected
to the page; updating it alone does not change the public site.
