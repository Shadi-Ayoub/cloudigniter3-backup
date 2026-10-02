/* Publisher's browser client has no access to credentials or arbitrary commands. */
import { publisherGroups } from "./navigation.mjs";
import { themeModes, nextTheme, resolvedTheme } from "./theme.mjs";
import { loadEditor, setEditorTheme } from "./editor.mjs";
import { createDiscardGuard } from "./discard.mjs";
("use strict");
const $ = (selector) => document.querySelector(selector);
const el = (tag, attrs = {}, ...children) => {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
    else if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (value !== undefined && value !== false)
      node.setAttribute(key, String(value));
  }
  node.append(...children.filter((x) => x !== null && x !== undefined));
  return node;
};
const button = (text, click, attrs = {}) =>
  el("button", { type: "button", onclick: click, ...attrs }, text);
const badge = (text, kind = "") => el("span", { class: `badge ${kind}` }, text);
let workspace,
  targetId,
  identity,
  jobs = [],
  jobId,
  lastFinished,
  editorDraft,
  configurationEditor,
  configurationReview;
let closing = false,
  pollTimer,
  identityTimer;
let dialogRevision = 0;
const groupSelections = new Map();
let token = new URLSearchParams(location.hash.slice(1)).get("session");
try {
  if (token) sessionStorage.setItem("publisher-session", token);
  else token = sessionStorage.getItem("publisher-session");
} catch {
  /* Private browsing can disable storage. */
}
history.replaceState(null, "", location.pathname);
const media = matchMedia("(prefers-color-scheme: dark)");
let themeMode = "system";
const applyTheme = () => {
  if (closing) return;
  const theme = resolvedTheme(themeMode, media.matches);
  document.documentElement.dataset.theme = theme;
  const title = `Theme: ${themeMode[0].toUpperCase() + themeMode.slice(1)}. Switch to ${nextTheme(themeMode)}.`;
  $("#theme").setAttribute("aria-label", title);
  $("#theme").title = title;
  document.querySelectorAll("[data-theme-icon]").forEach((icon) => {
    icon.toggleAttribute("hidden", icon.dataset.themeIcon !== themeMode);
  });
  setEditorTheme(theme);
};
try {
  const saved = localStorage.getItem("publisher-theme");
  if (themeModes.includes(saved)) themeMode = saved;
} catch {
  /* Optional preference. */
}
applyTheme();
media.addEventListener("change", applyTheme);
$("#theme").addEventListener("click", () => {
  themeMode = nextTheme(themeMode);
  applyTheme();
  try {
    localStorage.setItem("publisher-theme", themeMode);
  } catch {
    /* Optional preference. */
  }
});
async function api(route, payload) {
  const response = await fetch(`/api/${route}`, {
    method: payload === undefined ? "GET" : "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(payload === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
  });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || "Publisher request failed.");
  return value;
}
function report(error) {
  if (closing) return;
  $("#notice").textContent = error.message || String(error);
  $("#notice").hidden = false;
}
function guarded(work) {
  return () => Promise.resolve().then(work).catch(report);
}
const selected = () => workspace?.targets.find((t) => t.id === targetId);
const busy = () => jobs.some((j) => !j.finishedAt);
function updateIdentity() {
  const target = selected();
  const who = identity?.selected;
  $("#identity-name").textContent = who?.verified
    ? `${who.login} · ${who.profile || "active session"}`
    : who?.error
      ? `${workspace?.profiles[workspace.selectedProfile]?.username || "Active session"} · unverified`
      : "Checking session…";
  $("#identity-name").title = who?.error || "Verified GitHub identity";
  $("#identity-dot").classList.toggle("verified", Boolean(who?.verified));
  $("#active-account").textContent = identity
    ? `Shell account: ${identity.active.login || "unavailable"}${workspace?.selectedProfile ? ` · Publisher profile: ${workspace.selectedProfile}` : ""}`
    : "Reading local authentication";
  const repo = target?.repository;
  $("#destination-name").textContent = repo
    ? `${repo.buildRepository.split("/")[0]} / ${target.access ? "npm" : repo.delivery}`
    : "No publishing destination configured";
  $("#destination-detail").textContent = repo
    ? `${repo.sourceRepository || "Source unset"} → ${repo.buildRepository}`
    : "Set an explicit repository mapping in Configuration";
  $("#dialog-identity").replaceChildren(
    el(
      "span",
      {},
      `Identity: ${who?.login || workspace?.selectedProfile || "unverified"}${who?.verified ? "" : " · unverified"}`,
    ),
    el(
      "span",
      {},
      `Destination: ${repo?.buildRepository || "Local workspace"}`,
    ),
  );
}
async function refreshIdentity() {
  if (closing) return;
  try {
    identity = await api("identity");
    if (closing) return;
    updateIdentity();
  } catch (e) {
    report(e);
  }
}
async function refresh() {
  if (closing) return;
  const focused =
    document.activeElement
      ?.closest('[role="menu"]')
      ?.getAttribute("aria-labelledby") || document.activeElement?.id;
  workspace = await api("workspace");
  if (closing) return;
  if (!workspace.targets.some((t) => t.id === targetId))
    targetId = publisherGroups(workspace.targets)[0]?.targets[0]?.id;
  renderNavigation();
  renderTarget();
  updateIdentity();
  $("#git-summary").replaceChildren(
    el("strong", {}, workspace.git.branch || "No branch detected"),
    el("span", { class: "mono" }, workspace.git.commit || "No commit"),
    badge(
      `${workspace.git.changes} pending changes`,
      workspace.git.changes ? "warning" : "success",
    ),
  );
  if (workspace.warnings.length) {
    $("#notice").textContent = workspace.warnings.join(" ");
    $("#notice").hidden = false;
  }
  if (focused) document.getElementById(focused)?.focus({ preventScroll: true });
}
function closeTargetMenus(restoreFocus = false) {
  for (const trigger of document.querySelectorAll(
    '#target-navigation [aria-expanded="true"]',
  )) {
    trigger.setAttribute("aria-expanded", "false");
    document.getElementById(trigger.getAttribute("aria-controls")).hidden =
      true;
    if (restoreFocus) trigger.focus({ preventScroll: true });
  }
}
function renderNavigation() {
  const groups = publisherGroups(workspace.targets);
  $("#target-navigation").replaceChildren(
    ...groups.map((group) => {
      const active = group.targets.find((target) => target.id === targetId);
      if (active) groupSelections.set(group.id, active.id);
      const choice =
        active ||
        group.targets.find(
          (target) => target.id === groupSelections.get(group.id),
        ) ||
        group.targets[0];
      const dropdown = group.id !== "docs";
      const trigger = button(
        "",
        () => {
          if (!dropdown) {
            selectTarget(choice.id, group.id);
            return;
          }
          const expanded = trigger.getAttribute("aria-expanded") === "true";
          closeTargetMenus();
          if (!expanded) {
            trigger.setAttribute("aria-expanded", "true");
            menu.hidden = false;
            (
              menu.querySelector('[aria-checked="true"]') ||
              menu.querySelector("button")
            )?.focus();
          }
        },
        {
          id: `nav-${group.id}`,
          class: "category-trigger",
          "aria-current": active ? "true" : undefined,
          ...(dropdown
            ? {
                "aria-haspopup": "menu",
                "aria-expanded": "false",
                "aria-controls": `menu-${group.id}`,
              }
            : { "aria-controls": "target" }),
        },
      );
      trigger.append(
        el(
          "span",
          { class: "category-copy" },
          el("strong", {}, group.label),
          el("small", {}, dropdown ? choice.label : "CloudIgniter guide"),
        ),
      );
      if (dropdown)
        trigger.append(
          el("span", { class: "category-chevron", "aria-hidden": "true" }, "⌄"),
        );
      const menu = el(
        "div",
        {
          id: `menu-${group.id}`,
          class: "target-menu",
          role: "menu",
          "aria-labelledby": trigger.id,
          hidden: true,
        },
        ...group.targets.map((target) =>
          button(target.label, () => selectTarget(target.id, group.id), {
            role: "menuitemradio",
            "aria-checked": String(target.id === targetId),
            tabindex: -1,
          }),
        ),
      );
      trigger.addEventListener("keydown", (event) => {
        if (dropdown && ["ArrowDown", "ArrowUp"].includes(event.key)) {
          event.preventDefault();
          closeTargetMenus();
          trigger.setAttribute("aria-expanded", "true");
          menu.hidden = false;
          const items = menu.querySelectorAll("button");
          items[event.key === "ArrowUp" ? items.length - 1 : 0]?.focus();
        }
      });
      menu.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          closeTargetMenus(true);
          return;
        }
        const items = [...menu.querySelectorAll("button")];
        const index = items.indexOf(document.activeElement);
        if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
          event.preventDefault();
          const next =
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? items.length - 1
                : (index +
                    (event.key === "ArrowDown" ? 1 : -1) +
                    items.length) %
                  items.length;
          items[next]?.focus();
        } else if (
          event.key.length === 1 &&
          !event.ctrlKey &&
          !event.metaKey &&
          event.key !== " "
        ) {
          const ordered = [
            ...items.slice(index + 1),
            ...items.slice(0, index + 1),
          ];
          const match = ordered.find((item) =>
            item.textContent.toLowerCase().startsWith(event.key.toLowerCase()),
          );
          if (match) {
            event.preventDefault();
            match.focus();
          }
        }
      });
      return el(
        "div",
        { class: "target-category" },
        trigger,
        ...(dropdown ? [menu] : []),
      );
    }),
  );
}
function selectTarget(id, groupId) {
  targetId = id;
  renderNavigation();
  renderTarget();
  updateIdentity();
  document.getElementById(`nav-${groupId}`)?.focus({ preventScroll: true });
}
document.addEventListener("pointerdown", (event) => {
  if (!event.target.closest("#target-navigation")) closeTargetMenus();
});
$("#target-navigation").addEventListener("focusout", (event) => {
  if (
    !event.relatedTarget ||
    event.target.closest(".target-category") !==
      event.relatedTarget.closest(".target-category")
  )
    closeTargetMenus();
});
function actionButton(action, primary = false) {
  return button(action.label, () => openAction(action), {
    class: primary ? "primary" : "",
    disabled: busy() || selected()?.warnings.length > 0,
    title: action.description || action.id,
  });
}
function fact(label, value) {
  return el(
    "dl",
    { class: "fact" },
    el("dt", {}, label),
    el("dd", {}, value || "Not configured"),
  );
}
function repoLink(repo) {
  return repo
    ? el(
        "a",
        {
          href: `https://github.com/${repo}`,
          target: "_blank",
          rel: "noreferrer",
        },
        repo,
      )
    : "Not configured";
}
function renderTarget() {
  const t = selected();
  if (!t) {
    $("#target").replaceChildren(
      el(
        "div",
        { class: "empty" },
        "No supported targets detected. Add a workspace package or publisher.config.json to a project root.",
      ),
    );
    return;
  }
  $("#target").setAttribute("aria-labelledby", "project-title");
  const heading = el(
    "div",
    { class: "target-heading" },
    el(
      "div",
      {},
      el(
        "div",
        { class: "target-title" },
        el("h2", { id: "project-title" }, t.metadata.label ?? t.name),
        badge(t.version),
        badge(t.kind),
      ),
      el("code", {}, t.id),
    ),
    el(
      "div",
      { class: "tools" },
      button("Build viewer", guarded(openBuild)),
      button(
        "Package configuration",
        guarded(() => openConfig(t.id)),
      ),
    ),
  );
  const body = el(
    "div",
    { class: "card-body" },
    el(
      "div",
      { class: "facts" },
      fact("Source repository", repoLink(t.repository?.sourceRepository)),
      fact(
        "Build / public repository",
        repoLink(t.repository?.buildRepository),
      ),
      fact(
        "Registry & access",
        t.access
          ? `${workspace.release?.registry} · ${t.access}`
          : t.private
            ? "Private workspace project"
            : "No npm release policy",
      ),
      fact("Build output", t.buildDirectories.join(", ")),
    ),
  );
  for (const group of ["Build", "Verify", "Project", "GitHub"]) {
    const actions = t.actions.filter((a) => a.group === group);
    if (actions.length)
      body.append(
        el(
          "section",
          { class: "action-group" },
          el("h3", {}, group === "Project" ? "Project commands" : group),
          el(
            "div",
            { class: "action-buttons" },
            ...actions.map((a) => actionButton(a, a.id === "build")),
          ),
        ),
      );
  }
  const switches = t.actions.filter((a) => a.group === "Exports");
  body.append(
    el(
      "div",
      { class: "exports" },
      el(
        "div",
        {},
        el("strong", {}, "Package exports"),
        el(
          "small",
          {},
          t.exportMode === "src"
            ? "Development · src"
            : t.exportMode === "dist"
              ? "Production · dist"
              : "Direct / no src–dist switch",
        ),
      ),
      el(
        "div",
        { class: "tools" },
        ...switches.map((a) => {
          const b = actionButton(a);
          b.setAttribute("aria-pressed", a.id === `switch:${t.exportMode}`);
          return b;
        }),
      ),
    ),
  );
  if (t.metadata.assets !== undefined)
    body.append(
      el(
        "p",
        { class: "release-note" },
        t.metadata.assets
          ? "Assets are part of this project’s build recipe."
          : "This project does not declare a separate asset build.",
      ),
    );
  const scriptList = el(
    "div",
    { class: "script-list" },
    ...Object.entries(t.scripts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, command]) =>
        el("div", {}, el("strong", {}, name), el("code", {}, command)),
      ),
  );
  body.append(
    el(
      "details",
      { class: "details-list" },
      el(
        "summary",
        {},
        `Detected package scripts (${Object.keys(t.scripts).length})`,
      ),
      scriptList,
    ),
  );
  const releaseBody = el("div", { class: "card-body" });
  const releases = t.actions.filter((a) => a.group === "Publish");
  const steps = t.access
    ? [
        [
          "Plan the release",
          "Changesets computes versions and dependency updates.",
          ["npm:plan"],
        ],
        [
          "Request source review",
          "Submit to the configured private source repositories.",
          ["npm:publish", "npm:status"],
        ],
        [
          "Prepare approved artifacts",
          "Apply reviewed versions, commit them, then build an exact candidate.",
          ["npm:version", "npm:candidate"],
        ],
        [
          "Request build review",
          "Deliver verified archives. Final npm approval uses maintainer 2FA.",
          ["npm:deliver"],
        ],
      ]
    : t.kind === "template"
      ? [
          [
            "Prepare a public export",
            "Use the approved file inventory and standalone configuration.",
            ["template:export", "template:check"],
          ],
          [
            "Request private review",
            "Record the pristine export before public delivery.",
            ["template:publish", "template:status"],
          ],
          [
            "Deliver approved bytes",
            "Verify the merged request and independent approval.",
            ["template:deliver"],
          ],
        ]
      : [
          [
            "Build and verify",
            "Use this project’s detected scripts or explicit metadata commands.",
            [],
          ],
          [
            "Prepare delivery",
            "Generate the configured workflow for reviewed static artifacts.",
            ["github:scaffold"],
          ],
          [
            "Review in GitHub",
            "Commit approved site files and workflow to the build repository. Deployment runs there after its configured gates.",
            [],
          ],
        ];
  steps.forEach(([title, description, ids], i) =>
    releaseBody.append(
      el(
        "div",
        { class: "release-step" },
        el("span", { class: "step-number" }, String(i + 1)),
        el(
          "div",
          {},
          el("strong", {}, title),
          el("p", {}, description),
          el(
            "div",
            { class: "action-buttons" },
            ...ids
              .map((id) => releases.find((a) => a.id === id))
              .filter(Boolean)
              .map((a) => actionButton(a)),
          ),
        ),
      ),
    ),
  );
  for (const a of releases.filter(
    (a) => a.id === "github:scaffold" && t.access,
  ))
    releaseBody.append(actionButton(a));
  if (!t.access && t.kind !== "template")
    releaseBody.append(
      el(
        "p",
        { class: "notice" },
        t.metadata.staticHosting
          ? "Website delivery requires a reviewed static artifact commit. Publisher can build, verify, and scaffold; it does not upload a site or provision AWS."
          : "No automated publishing route is configured for this target. Add repository and hosting metadata before delivery.",
      ),
    );
  releaseBody.append(
    el(
      "p",
      { class: "release-note" },
      `Base: ${workspace.release?.baseBranch || "Not configured"} · Reviewers: ${workspace.release?.reviewers.join(", ") || "Not configured"}. A successful command or merged request is not proof of registry publication.`,
    ),
  );
  $("#target").replaceChildren(
    heading,
    ...t.warnings.map((w) => el("div", { class: "notice" }, w)),
    el(
      "div",
      { class: "grid" },
      el(
        "section",
        { class: "card" },
        el(
          "div",
          { class: "section-heading" },
          el("h2", {}, "Build & verify"),
          badge("Local workspace"),
        ),
        body,
      ),
      el(
        "section",
        { class: "card" },
        el(
          "div",
          { class: "section-heading" },
          el("h2", {}, "Release workflow"),
          badge("Review required"),
        ),
        releaseBody,
      ),
    ),
  );
}
function hasDraft() {
  return editorDraft && editorDraft.saved !== editorDraft.getValue();
}
function disposeEditor() {
  configurationReview?.dispose();
  configurationReview = null;
  configurationEditor?.dispose();
  configurationEditor = null;
  editorDraft = null;
}
let discardButtons = [],
  discardStatus;
const canDiscard = createDiscardGuard({
  getDraft: () => editorDraft,
  getRevision: () => dialogRevision,
  isClosing: () => closing,
  ask: async (draft) => {
    const { confirmDiscard } = await import("/feedback.js");
    if (closing) return false;
    if (discardStatus)
      discardStatus.node.textContent = "Waiting for your discard decision…";
    return confirmDiscard({ file: draft.file });
  },
  onPending: (pending) => {
    configurationEditor?.setReadOnly(pending || Boolean(configurationReview));
    if (pending) {
      const status = $("#dialog-content .editor-status");
      if (status) {
        discardStatus = { node: status, text: status.textContent };
        status.textContent = "Preparing discard confirmation…";
      }
      discardButtons = [
        ...document.querySelectorAll("#dialog-content .dialog-actions button"),
      ].map((control) => ({ control, disabled: control.disabled }));
      discardButtons.forEach(({ control }) => (control.disabled = true));
    } else {
      discardButtons.forEach(
        ({ control, disabled }) => (control.disabled = disabled),
      );
      discardButtons = [];
      if (discardStatus?.node.isConnected)
        discardStatus.node.textContent = discardStatus.text;
      discardStatus = null;
    }
  },
  onError: (error) => inlineError($("#dialog-content"), error),
});
async function openDialog(title, kicker = "PUBLISHER") {
  const revision = dialogRevision;
  if (!(await canDiscard()) || revision !== dialogRevision || closing)
    return false;
  disposeEditor();
  dialogRevision++;
  $("#dialog-title").textContent = title;
  $("#dialog-kicker").textContent = kicker;
  $("#dialog-content").replaceChildren();
  updateIdentity();
  if (!$("#dialog").open) $("#dialog").showModal();
  return true;
}
async function closeDialog() {
  const revision = dialogRevision;
  if (!(await canDiscard()) || revision !== dialogRevision || closing) return;
  disposeEditor();
  dialogRevision++;
  $("#dialog").close();
}
$("#dialog-close").addEventListener("click", closeDialog);
$("#dialog").addEventListener("cancel", (event) => {
  event.preventDefault();
  closeDialog();
});
window.addEventListener("beforeunload", (event) => {
  if (!closing && hasDraft()) {
    event.preventDefault();
    event.returnValue = "";
  }
});
function inlineError(container, error) {
  container.querySelector(".inline-error")?.remove();
  container.append(
    el("div", { class: "inline-error", role: "alert" }, error.message),
  );
}
const labels = {
  mode: "Build mode",
  obfuscation: "Obfuscation",
  intent: "Release intent",
  summary: "Release summary",
  tag: "npm channel (optional)",
  preid: "Prerelease identifier (optional)",
  number: "Pull request number",
  request: "Release request ID",
  output: "External output directory",
  manifest: "Candidate manifest path",
  repositoryKind: "Repository",
  dryRun: "Preview only (dry run)",
};
const options = {
  mode: [
    ["prod", "Production"],
    ["dev", "Development"],
  ],
  obfuscation: [
    ["configured", "Use package recipe"],
    ["off", "Without obfuscation"],
    ["on", "With obfuscation"],
  ],
  intent: [
    ["fix", "Fix / patch"],
    ["feature", "Feature / minor"],
    ["breaking", "Breaking change"],
    ["major", "Explicit major"],
    ["initial", "Initial 0.1.0"],
    ["changed", "All pending Changesets"],
  ],
  repositoryKind: [
    ["source", "Source repository"],
    ["build", "Build repository"],
  ],
};
async function openAction(action) {
  if (!(await openDialog(action.label, selected().name))) return;
  const target = selected(),
    content = $("#dialog-content"),
    form = el("form"),
    grid = el("div", { class: "form-grid" });
  const inputs = {};
  for (const key of action.fields || []) {
    let input;
    if (options[key])
      input = el(
        "select",
        { name: key, id: `field-${key}` },
        ...options[key].map(([value, label]) => el("option", { value }, label)),
      );
    else if (key === "dryRun") {
      input = el("input", { type: "checkbox", name: key, id: `field-${key}` });
      input.checked = true;
    } else
      input = el(key === "summary" ? "textarea" : "input", {
        id: `field-${key}`,
        name: key,
        ...(key === "number" ? { type: "number", min: "1", step: "1" } : {}),
        ...(key === "request"
          ? { placeholder: "24-character request ID" }
          : {}),
        ...(key === "output"
          ? { placeholder: "/absolute/path/to/new-output" }
          : {}),
      });
    inputs[key] = input;
    const label = el(
      "label",
      {
        for: `field-${key}`,
        class:
          key === "summary" || key === "output" || key === "manifest"
            ? "wide"
            : key === "dryRun"
              ? "checkbox-row"
              : "",
      },
      labels[key],
      input,
    );
    grid.append(label);
  }
  form.append(grid);
  const preview = button("Review command", null, {
    type: "submit",
    class: "primary",
  });
  const actions = el("div", { class: "dialog-actions" }, preview);
  if (["npm:candidate", "npm:version", "npm:deliver"].includes(action.id))
    content.append(
      el(
        "p",
        { class: "notice" },
        "This action applies to the entire recorded release, including dependent packages. Candidate builds require a clean, disposable integration checkout.",
      ),
    );
  if (target.governedBuild && action.id === "build")
    content.append(
      el(
        "p",
        { class: "hint" },
        "The package quality gate runs before cleanup. Development and production follow the package-owned recipe; the obfuscation option changes only that step.",
      ),
    );
  if (action.description)
    content.append(el("p", { class: "hint" }, action.description));
  content.append(form, actions);
  form.append(actions);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    preview.disabled = true;
    content.querySelector(".command-preview")?.remove();
    content.querySelector(".inline-error")?.remove();
    const input = Object.fromEntries(
      Object.entries(inputs).map(([k, node]) => [
        k,
        node.type === "checkbox" ? node.checked : node.value,
      ]),
    );
    try {
      const plan = await api("plan", {
        target: target.id,
        action: action.id,
        input,
      });
      const execute = button(
        plan.remote ? "Submit request" : "Run action",
        async () => {
          execute.disabled = true;
          try {
            const job = await api("run", { id: plan.id });
            jobs.unshift(job);
            jobId = job.id;
            await closeDialog();
            renderTarget();
            renderJobs();
            $("#log").focus({ preventScroll: true });
            $("#console-title").scrollIntoView({
              behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
                ? "auto"
                : "smooth",
              block: "center",
            });
          } catch (error) {
            inlineError(content, error);
          }
        },
        { class: "primary", disabled: busy() },
      );
      const display = el(
        "div",
        { class: "command-preview" },
        el("span", { class: "eyebrow" }, "COMMAND REVIEW"),
        el(
          "p",
          { class: "hint" },
          `Profile: ${plan.profile || "active GitHub session"} · Destination: ${plan.destination}`,
        ),
        ...plan.commands.map((c) =>
          el(
            "div",
            { class: "command-entry" },
            el(
              "p",
              { class: "command-directory" },
              el("span", {}, "Working directory"),
              el("code", {}, c.cwd),
            ),
            el(
              "pre",
              { class: "command-line" },
              el(
                "code",
                {},
                `${c.command} ${c.args.map((a) => (/\s/.test(a) ? JSON.stringify(a) : a)).join(" ")}`,
              ),
            ),
          ),
        ),
        el(
          "p",
          { class: "hint" },
          plan.remote
            ? "This submits a remote review request or delivers an approved template. Existing policy checks still apply."
            : "Review the command before running it. File-changing actions use the existing scripts and their safeguards.",
        ),
        el("div", { class: "dialog-actions" }, execute),
      );
      content.append(display);
      execute.focus();
      form.addEventListener(
        "input",
        () => {
          display.remove();
        },
        { once: true },
      );
    } catch (error) {
      inlineError(content, error);
    } finally {
      preview.disabled = false;
    }
  });
}
async function openConfig(target) {
  if (
    !(await openDialog(
      target ? `${selected().label} configuration` : "Workspace configuration",
      "LINKED FILES",
    ))
  )
    return;
  const revision = dialogRevision;
  const content = $("#dialog-content");
  content.append(
    el(
      "p",
      { class: "hint" },
      "Edit CloudIgniter publishing and package-build configuration. Review the highlighted changes before applying them. Only the selected file is saved; external changes are detected before writing. Run the relevant checks after editing.",
    ),
  );
  const search = el("input", {
    type: "search",
    placeholder: "Filter configuration files",
    "aria-label": "Filter configuration files",
  });
  const list = el("nav", {
      class: "file-list",
      "aria-label": "Configuration files",
    }),
    filename = el("div", { class: "editor-file mono" }, "No file selected"),
    area = el("div", { class: "config-editor" }),
    reviewArea = el("div", { class: "config-review", hidden: true }),
    diffKey = el(
      "span",
      { class: "diff-key", hidden: true },
      el("span", { class: "diff-removed" }, "− Removed"),
      el("span", { class: "diff-added" }, "+ Added"),
    ),
    placeholder = el(
      "p",
      { class: "editor-placeholder" },
      "Select a file to view and edit.",
    ),
    status = el(
      "div",
      { class: "editor-status", role: "status" },
      "Select a configuration file.",
    ),
    editor = el("div", { class: "editor-main" });
  let data, review;
  const showStatus = (message) => {
    status.textContent = message;
    status.title = message;
  };
  const save = button(
    "Review changes",
    async () => {
      if (
        !hasDraft() ||
        !data ||
        busy() ||
        review ||
        editorDraft.saving ||
        canDiscard.pending()
      )
        return;
      save.disabled = true;
      const draft = editorDraft;
      const candidate = Object.freeze({
        file: data.file,
        content: draft.getValue(),
        revision: data.revision,
      });
      try {
        const monaco = await loadEditor();
        if (revision !== dialogRevision || draft !== editorDraft || closing)
          return;
        configurationEditor.setReadOnly(true);
        review = candidate;
        reviewArea.hidden = false;
        configurationReview = monaco.createReview(reviewArea, {
          file: review.file,
          original: draft.saved,
          modified: review.content,
        });
        area.inert = true;
        area.style.visibility = "hidden";
        search.disabled = true;
        list.querySelectorAll("button").forEach((b) => (b.disabled = true));
        save.hidden = true;
        diffKey.hidden = false;
        apply.hidden = false;
        back.hidden = false;
        apply.disabled = true;
        apply.setAttribute("aria-label", `Apply changes to ${review.file}`);
        showStatus(`Preparing change review for ${review.file}…`);
        if (
          !(await configurationReview.ready) ||
          revision !== dialogRevision ||
          review !== candidate ||
          closing
        )
          return;
        apply.disabled = busy();
        showStatus(`Reviewing ${review.file}. Only this file will be saved.`);
        apply.focus();
      } catch (error) {
        endReview();
        showStatus(error.message);
      }
    },
    { class: "primary", disabled: true },
  );
  const endReview = () => {
    configurationReview?.dispose();
    configurationReview = null;
    review = null;
    reviewArea.hidden = true;
    configurationEditor?.setReadOnly(false);
    area.inert = false;
    area.style.visibility = "";
    search.disabled = false;
    list.querySelectorAll("button").forEach((b) => (b.disabled = false));
    save.hidden = false;
    diffKey.hidden = true;
    save.disabled = busy() || editorDraft?.saving || !hasDraft();
    apply.hidden = true;
    back.hidden = true;
  };
  const back = button(
    "Back to editing",
    () => {
      if (editorDraft?.saving) return;
      endReview();
      showStatus(hasDraft() ? "Unsaved changes" : "No unsaved changes");
      configurationEditor?.focus();
    },
    { hidden: true },
  );
  const apply = button(
    "Apply changes",
    async () => {
      if (
        !review ||
        !editorDraft ||
        !data ||
        busy() ||
        editorDraft.saving ||
        canDiscard.pending()
      )
        return;
      const draft = editorDraft;
      const approved = review;
      if (
        draft.getValue() !== approved.content ||
        data.file !== approved.file
      ) {
        endReview();
        showStatus("The draft changed. Review it again before saving.");
        return;
      }
      apply.disabled = true;
      back.disabled = true;
      draft.saving = true;
      showStatus(`Applying changes to ${approved.file}…`);
      try {
        const result = await api("config", approved);
        data.revision = result.revision;
        draft.saved = approved.content;
        endReview();
        showStatus(
          `Saved ${approved.file}. Workspace configuration refreshed.`,
        );
        await refresh();
      } catch (error) {
        showStatus(error.message);
      } finally {
        draft.saving = false;
        apply.disabled = busy();
        back.disabled = false;
        save.disabled = busy() || !hasDraft();
      }
    },
    { class: "primary", hidden: true },
  );
  editor.append(
    filename,
    el("div", { class: "config-editor-shell" }, area, placeholder, reviewArea),
    status,
    el("div", { class: "dialog-actions" }, diffKey, save, back, apply),
  );
  content.append(search, el("div", { class: "editor-layout" }, list, editor));
  try {
    const files = await api(
      `configs${target ? `?target=${encodeURIComponent(target)}` : ""}`,
    );
    if (revision !== dialogRevision) return;
    let active,
      loadingFile = 0;
    const render = () =>
      list.replaceChildren(
        ...files
          .filter((f) => f.toLowerCase().includes(search.value.toLowerCase()))
          .map((file) =>
            button(
              file,
              async () => {
                if (review) return;
                if (
                  !(await canDiscard()) ||
                  revision !== dialogRevision ||
                  closing
                )
                  return;
                const selection = ++loadingFile;
                editorDraft = null;
                data = null;
                configurationEditor?.setReadOnly(true);
                save.disabled = true;
                area.setAttribute("aria-busy", "true");
                showStatus(`Loading ${file}…`);
                if (!configurationEditor)
                  placeholder.textContent = "Loading editor…";
                active = file;
                render();
                try {
                  const [loadedFile, monaco] = await Promise.all([
                    api(`config?file=${encodeURIComponent(file)}`),
                    loadEditor(),
                  ]);
                  if (
                    revision !== dialogRevision ||
                    selection !== loadingFile ||
                    closing
                  )
                    return;
                  data = { ...loadedFile, file };
                  if (configurationEditor)
                    configurationEditor.setDocument({
                      file,
                      content: data.content,
                    });
                  else
                    configurationEditor = monaco.createEditor(area, {
                      file,
                      content: data.content,
                      onChange: () => {
                        save.disabled =
                          busy() || editorDraft?.saving || !hasDraft();
                        showStatus(
                          hasDraft() ? "Unsaved changes" : "No unsaved changes",
                        );
                      },
                    });
                  configurationEditor.setReadOnly(false);
                  editorDraft = {
                    file,
                    getValue: configurationEditor.getValue,
                    saved: data.content,
                  };
                  filename.textContent = file;
                  filename.title = file;
                  placeholder.hidden = true;
                  area.setAttribute("aria-busy", "false");
                  showStatus("Saved version loaded from disk.");
                  save.setAttribute("aria-label", `Review changes to ${file}`);
                  save.title = `Review changes to ${file}`;
                  save.disabled = true;
                  configurationEditor.focus();
                } catch (e) {
                  if (
                    revision !== dialogRevision ||
                    selection !== loadingFile ||
                    closing
                  )
                    return;
                  area.setAttribute("aria-busy", "false");
                  showStatus(`Unable to load ${file}: ${e.message}`);
                  if (!configurationEditor)
                    placeholder.textContent =
                      "Unable to load this file. Select it again to retry.";
                }
              },
              { class: active === file ? "selected" : "" },
            ),
          ),
      );
    search.addEventListener("input", render);
    render();
    if (!files.length)
      list.append(el("p", { class: "empty" }, "No editable files detected."));
  } catch (e) {
    if (revision !== dialogRevision || closing) return;
    inlineError(content, e);
  }
}

async function openBuild() {
  const target = selected();
  if (!(await openDialog("Build viewer", target.name))) return;
  const content = $("#dialog-content"),
    search = el("input", {
      type: "search",
      placeholder: "Filter built paths",
      "aria-label": "Filter built paths",
    }),
    tree = el("div", { class: "tree-list" });
  content.append(
    el(
      "p",
      { class: "hint" },
      "Inspect the files currently on disk. Development and production usually share the same output folder; the latest build replaces it. Symbolic links are never followed.",
    ),
    search,
    tree,
  );
  try {
    const result = await api(`build?target=${encodeURIComponent(target.id)}`);
    const draw = () =>
      tree.replaceChildren(
        ...result.entries
          .filter((e) =>
            e.path.toLowerCase().includes(search.value.toLowerCase()),
          )
          .map((e) =>
            el(
              "div",
              { class: "tree-row" },
              el(
                "code",
                {},
                `${e.type === "directory" ? "▸ " : "  "}${e.path}`,
              ),
              el(
                "span",
                {},
                e.type === "file"
                  ? `${Intl.NumberFormat().format(e.size)} B`
                  : e.type,
              ),
            ),
          ),
      );
    search.addEventListener("input", draw);
    draw();
    if (result.truncated)
      content.append(
        el(
          "p",
          { class: "notice" },
          "Showing up to 1,500 entries and 12 directory levels. Cache folders are omitted.",
        ),
      );
  } catch (e) {
    inlineError(content, e);
  }
}
async function openProfiles() {
  if (!(await openDialog("GitHub profiles", "SESSION IDENTITY"))) return;
  const content = $("#dialog-content");
  content.append(
    el(
      "p",
      { class: "hint" },
      "Choose the identity Publisher uses for subsequent GitHub commands. DEV verifies the stored credential and pins it per command. The shell’s active account remains visible in the header.",
    ),
  );
  const profiles = [
    [
      null,
      {
        username: identity?.active.login || "Active gh session",
        role: "shell account",
      },
    ],
    ...Object.entries(workspace.profiles).sort(([a], [b]) =>
      a.localeCompare(b),
    ),
  ];
  for (const [name, profile] of profiles) {
    const select = button(
      name === workspace.selectedProfile ? "Verify current" : "Use profile",
      async () => {
        select.disabled = true;
        try {
          identity = await api("profile", { profile: name });
          await refresh();
          await closeDialog();
        } catch (e) {
          inlineError(content, e);
        } finally {
          select.disabled = busy();
        }
      },
      { disabled: busy() },
    );
    content.append(
      el(
        "div",
        { class: "profile-option" },
        el(
          "div",
          {},
          el("strong", {}, `${name || "Active session"} · ${profile.username}`),
          el("small", {}, profile.role),
          ...(name
            ? [
                el(
                  "code",
                  {},
                  `Sign in from a terminal: dev github auth login --profile=${name}`,
                ),
              ]
            : []),
        ),
        select,
      ),
    );
  }
  content.append(
    el(
      "p",
      { class: "hint" },
      "Add profile names and usernames in .cloudigniter/github-profiles.json. Credentials remain in GitHub CLI’s credential store. Browser login is initiated from a terminal.",
    ),
  );
}
async function openFlow() {
  if (!(await openDialog("From source to publication", "PUBLISHING FLOW")))
    return;
  const node = (title, detail, gate = false) =>
    el(
      "div",
      { class: `flow-node ${gate ? "gate" : ""}` },
      el("strong", {}, title),
      el("small", {}, detail),
    );
  const lane = (title, ...nodes) =>
    el("section", { class: "flow-lane" }, el("h3", {}, title), ...nodes);
  $("#dialog-content").append(
    el(
      "p",
      { class: "hint" },
      "Local preparation is separate from remote review and final delivery. The selected project determines which actions are available.",
    ),
    el(
      "div",
      { class: "flow-grid" },
      lane(
        "npm packages",
        node(
          "Build & verify",
          "Development / production → recipe obfuscation, on or off",
        ),
        node(
          "Plan versions",
          "Fix · feature · breaking · major · initial · pending Changesets",
        ),
        node(
          "Request source review",
          "Clean base + requester → one PR per affected package",
        ),
        node(
          "Source approval",
          "Independent exact-head approval + merge",
          true,
        ),
        node(
          "Apply versions & commit",
          "Then build / test / pack a verified candidate",
        ),
        node(
          "Request build review",
          "Exact archives + manifest → private build PRs",
        ),
        node(
          "Build approval & npm stage",
          "Reviewed workflow stages the exact archive",
          true,
        ),
        node(
          "npm maintainer approval",
          "Interactive 2FA → registry publication; verify separately",
        ),
      ),
      lane(
        "Application templates",
        node(
          "Export approved inventory",
          "Standalone public configuration; external output folder",
        ),
        node("Verify pristine export", "Compare every approved file and hash"),
        node(
          "Request private review",
          "Record source selection and reproducible digest",
        ),
        node(
          "Independent approval",
          "Merged request + exact reviewed head",
          true,
        ),
        node(
          "Deliver public files",
          "Approver verifies digest; no private Git history",
        ),
        node(
          "Public repository",
          "Non-force update; preserve repository governance",
        ),
      ),
      lane(
        "Docs & websites",
        node(
          "Detect build capability",
          "Workspace scripts or publisher.config.json commands",
        ),
        node("Build & test", "Inspect output with Build viewer"),
        node(
          "Static hosting configured?",
          "Only static artifacts; never upload server .next output",
          true,
        ),
        node(
          "Generate delivery workflow",
          "Local scaffold for the configured build repository",
        ),
        node(
          "Review artifact commit",
          "Commit site/index.html and reviewed workflow externally",
          true,
        ),
        node(
          "Configured GitHub Actions",
          "S3 / CloudFront workflow after remote setup; no upload action in Publisher",
        ),
      ),
    ),
    el(
      "div",
      { class: "flow-options" },
      el("h3", {}, "Branches, previews & recovery"),
      el(
        "ul",
        {},
        el(
          "li",
          {},
          "Local build: quality failure stops before cleanup. Development retains the development recipe; production follows its production recipe. Source/distribution switching is a separate explicit action.",
        ),
        el(
          "li",
          {},
          "Release planning includes dependent packages and pending Changesets. Prerelease cycles use alpha, beta, or rc channels; initial releases require explicit registry bootstrap when native staging is unavailable.",
        ),
        el(
          "li",
          {},
          "Dry runs do not write. Release planning and template-publish previews are offline; approval/delivery previews can read GitHub.",
        ),
        el(
          "li",
          {},
          "Legacy monorepo staging remains a CI-only dev npm stage operation. Paired releases use reviewed per-build-repository workflows.",
        ),
        el(
          "li",
          {},
          "Missing policy, credentials, dirty base, failed checks, changed bytes, stale approvals, or rejected requests stop the action. Correct the reported cause and preview again.",
        ),
        el(
          "li",
          {},
          "Identical requests can be recovered. Partial multi-repository submission is not atomic; preserve the log and inspect existing requests before retrying. Never infer publication from a merged request.",
        ),
        el(
          "li",
          {},
          "Cancel stops local processes. Already completed filesystem changes or GitHub writes remain and must be inspected. PR review and merge controls are outside this version.",
        ),
      ),
    ),
  );
}
function renderJobs() {
  const job = jobs.find((j) => j.id === jobId) || jobs[0];
  const running = jobs.find((j) => !j.finishedAt);
  $("#cancel-job").hidden = !running || running.status === "cancelled";
  $("#job-progress").hidden = !running;
  $("#download-log").disabled = !job;
  if (!job) return;
  jobId = job.id;
  $("#job-history").replaceChildren(
    ...jobs.map((j) =>
      button(
        j.label,
        () => {
          jobId = j.id;
          renderJobs();
        },
        { class: j.id === job.id ? "selected" : "" },
      ),
    ),
  );
  [...$("#job-history").children].forEach((b, i) =>
    b.append(el("small", {}, `${jobs[i].target} · ${jobs[i].status}`)),
  );
  $("#job-status").textContent = job.status;
  $("#job-status").className =
    `badge ${job.status === "succeeded" ? "success" : job.status === "failed" ? "danger" : job.status === "running" ? "running" : "warning"}`;
  const seconds = Math.max(
    0,
    Math.round(
      ((job.finishedAt ? Date.parse(job.finishedAt) : Date.now()) -
        Date.parse(job.startedAt)) /
        1000,
    ),
  );
  $("#job-meta").textContent =
    `${job.target} · ${job.profile || "active session"} · ${seconds}s${job.finishedAt ? ` · exit ${job.exitCode ?? "cancelled"}` : " · running"} · ${job.destination}`;
  const log = $("#log"),
    nearBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 80;
  log.textContent = job.log || "Starting command…";
  if (nearBottom) log.scrollTop = log.scrollHeight;
  $("#structured").hidden = true;
  if (job.finishedAt) {
    const offset = job.log.indexOf("\n{");
    if (offset >= 0)
      try {
        $("#json-result").textContent = JSON.stringify(
          JSON.parse(job.log.slice(offset + 1)),
          null,
          2,
        );
        $("#structured").hidden = false;
      } catch {
        /* Non-JSON output remains in the terminal. */
      }
  }
}
async function pollJobs() {
  if (closing) return;
  try {
    const wasBusy = busy();
    jobs = await api("jobs");
    if (closing) return;
    renderJobs();
    const completed = jobs.find((j) => j.finishedAt);
    if (completed && completed.id !== lastFinished) {
      lastFinished = completed.id;
      $("#job-announcement").textContent =
        `${completed.label}: ${completed.status}.`;
      await refresh();
    } else if (wasBusy !== busy()) renderTarget();
  } catch (e) {
    report(e);
    if (/session expired/i.test(e.message)) return;
  }
  if (!closing) pollTimer = setTimeout(pollJobs, busy() ? 800 : 3000);
}
$("#cancel-job").addEventListener(
  "click",
  guarded(async () => {
    const job = jobs.find((j) => !j.finishedAt);
    if (job) await api("cancel", { id: job.id });
  }),
);
$("#download-log").addEventListener("click", () => {
  const job = jobs.find((j) => j.id === jobId);
  if (!job) return;
  const url = URL.createObjectURL(new Blob([job.log], { type: "text/plain" }));
  const a = el("a", { href: url, download: `publisher-${job.id}.log` });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
$("#refresh").addEventListener(
  "click",
  guarded(async () => {
    $("#notice").hidden = true;
    await refresh();
    await refreshIdentity();
  }),
);
$("#config-button").addEventListener(
  "click",
  guarded(() => openConfig()),
);
$("#profile-button").addEventListener("click", openProfiles);
$("#flow-button").addEventListener("click", openFlow);
$("#close-publisher").addEventListener("click", () => {
  $("#shutdown-draft").hidden = !hasDraft();
  $("#shutdown-status").textContent = "";
  $("#shutdown-dialog").showModal();
  $("#shutdown-cancel").focus();
});
$("#shutdown-cancel").addEventListener("click", () =>
  $("#shutdown-dialog").close(),
);
$("#shutdown-dialog").addEventListener("cancel", (event) => {
  if (closing) event.preventDefault();
});
$("#shutdown-confirm").addEventListener("click", async () => {
  if (closing) return;
  closing = true;
  clearTimeout(pollTimer);
  $("#shutdown-confirm").disabled = true;
  $("#shutdown-cancel").disabled = true;
  $("#shutdown-status").textContent =
    "Stopping running actions and closing Publisher…";
  try {
    await api("shutdown", { confirmed: true });
    clearInterval(identityTimer);
    media.removeEventListener("change", applyTheme);
    disposeEditor();
    dialogRevision++;
    try {
      sessionStorage.removeItem("publisher-session");
    } catch {
      /* Storage is optional. */
    }
    token = null;
    const heading = el("h1", { tabindex: "-1" }, "Publisher closed");
    document.body.replaceChildren(
      el(
        "main",
        { class: "shutdown-screen" },
        heading,
        el("p", {}, "The local server has stopped. You can close this tab."),
        el(
          "p",
          {},
          "To start a new session, run ",
          el("code", {}, "dev publisher"),
          " in your terminal.",
        ),
      ),
    );
    heading.focus();
    try {
      window.close();
    } catch {
      /* The closed-session page remains visible. */
    }
  } catch (error) {
    closing = false;
    $("#shutdown-status").textContent =
      `Unable to close Publisher: ${error.message}`;
    $("#shutdown-confirm").disabled = false;
    $("#shutdown-cancel").disabled = false;
    void pollJobs();
  }
});
(async () => {
  try {
    await refresh();
    if (closing) return;
    void refreshIdentity();
    void pollJobs();
    identityTimer = setInterval(refreshIdentity, 60_000);
  } catch (e) {
    report(e);
    $("#target").replaceChildren(
      el(
        "p",
        { class: "empty" },
        "Reopen the session URL printed in your terminal to connect to Publisher.",
      ),
    );
  }
})();
