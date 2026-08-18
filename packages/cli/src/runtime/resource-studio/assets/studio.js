(() => {
  "use strict";

  const FALLBACK_FIELD_TYPES = [
    "ID",
    "String",
    "Int",
    "Float",
    "Boolean",
    "AWSDate",
    "AWSTime",
    "AWSDateTime",
    "AWSTimestamp",
    "AWSEmail",
    "AWSJSON",
    "AWSPhone",
    "AWSURL",
    "AWSIPAddress",
  ];
  const FALLBACK_AUTH_STRATEGIES = [
    "authenticated",
    "guest",
    "publicApiKey",
    "owner",
    "ownerDefinedIn",
    "ownersDefinedIn",
    "group",
    "groups",
    "groupDefinedIn",
    "groupsDefinedIn",
    "custom",
  ];
  const FALLBACK_OPERATIONS = ["create", "read", "update", "delete"];
  const FALLBACK_PROVIDERS = ["userPools", "identityPool", "oidc", "function"];
  const RESERVED_FIELDS = new Set([
    "PK",
    "SK",
    "id",
    "ciScopeKey",
    "ciSortKey",
    "createdAt",
    "updatedAt",
  ]);
  const FIELD_BASE_OPTIONS = ["PK", "SK", "id", "ciScopeKey", "ciSortKey"];

  const dom = {
    sessionStatus: document.querySelector("#session-status"),
    shutdownButton: document.querySelector("#shutdown-button"),
    fatalPanel: document.querySelector("#fatal-panel"),
    fatalMessage: document.querySelector("#fatal-message"),
    retryButton: document.querySelector("#retry-button"),
    newEntityButton: document.querySelector("#new-entity-button"),
    entitySearch: document.querySelector("#entity-search"),
    entityList: document.querySelector("#entity-list"),
    entityEmpty: document.querySelector("#entity-empty"),
    historyList: document.querySelector("#history-list"),
    historyEmpty: document.querySelector("#history-empty"),
    undoButton: document.querySelector("#undo-button"),
    warningPanel: document.querySelector("#warning-panel"),
    warningList: document.querySelector("#warning-list"),
    awsProfile: document.querySelector("#aws-profile"),
    sandboxIdentifier: document.querySelector("#sandbox-identifier"),
    awsStatus: document.querySelector("#aws-status"),
    awsResult: document.querySelector("#aws-result"),
    preflightButton: document.querySelector("#preflight-button"),
    ssoButton: document.querySelector("#sso-button"),
    deployButton: document.querySelector("#deploy-button"),
    nodeRuntimeNote: document.querySelector("#node-runtime-note"),
    verifiedDeploymentTarget: document.querySelector(
      "#verified-deployment-target",
    ),
    verifiedAccount: document.querySelector("#verified-account"),
    verifiedRegion: document.querySelector("#verified-region"),
    verifiedArn: document.querySelector("#verified-arn"),
    verifiedExpiry: document.querySelector("#verified-expiry"),
    editorMode: document.querySelector("#editor-mode"),
    editorHeading: document.querySelector("#editor-heading"),
    form: document.querySelector("#entity-form"),
    formErrors: document.querySelector("#form-errors"),
    formErrorList: document.querySelector("#form-error-list"),
    entityId: document.querySelector("#entity-id"),
    entityName: document.querySelector("#entity-name"),
    pluralName: document.querySelector("#entity-plural-name"),
    scope: document.querySelector("#entity-scope"),
    description: document.querySelector("#entity-description"),
    managementPath: document.querySelector("#management-path"),
    managementTitle: document.querySelector("#management-title"),
    systemFields: document.querySelector("#system-fields"),
    fieldsList: document.querySelector("#fields-list"),
    fieldsEmpty: document.querySelector("#fields-empty"),
    addFieldButton: document.querySelector("#add-field-button"),
    authList: document.querySelector("#auth-list"),
    authEmpty: document.querySelector("#auth-empty"),
    addAuthButton: document.querySelector("#add-auth-button"),
    indexesList: document.querySelector("#indexes-list"),
    indexesEmpty: document.querySelector("#indexes-empty"),
    addIndexButton: document.querySelector("#add-index-button"),
    fieldNameOptions: document.querySelector("#field-name-options"),
    resetFormButton: document.querySelector("#reset-form-button"),
    dropEntityButton: document.querySelector("#drop-entity-button"),
    saveEntityButton: document.querySelector("#save-entity-button"),
    activityList: document.querySelector("#activity-list"),
    activityEmpty: document.querySelector("#activity-empty"),
    refreshLogsButton: document.querySelector("#refresh-logs-button"),
    confirmDialog: document.querySelector("#confirm-dialog"),
    confirmTitle: document.querySelector("#confirm-title"),
    confirmMessage: document.querySelector("#confirm-message"),
    confirmAction: document.querySelector("#confirm-action"),
    toast: document.querySelector("#toast"),
    fieldTemplate: document.querySelector("#field-template"),
    authTemplate: document.querySelector("#auth-template"),
    indexTemplate: document.querySelector("#index-template"),
  };

  const model = {
    csrf: undefined,
    state: undefined,
    selectedId: undefined,
    pendingConfirmation: undefined,
    routeTouched: false,
    pluralTouched: false,
    idTouched: false,
    titleTouched: false,
    hydrating: false,
    initialized: false,
    toastTimer: undefined,
    deployIntent: undefined,
    deployIntentTimer: undefined,
    controlSequence: 0,
  };

  class StudioApiError extends Error {
    constructor(message, options = {}) {
      super(message);
      this.name = "StudioApiError";
      this.code = options.code;
      this.status = options.status;
      this.conflicts = options.conflicts ?? [];
    }
  }

  function text(value) {
    return value === undefined || value === null ? "" : String(value);
  }

  function wordsFromIdentifier(value) {
    return text(value)
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/[-_]+/g, " ")
      .trim();
  }

  function kebabCase(value) {
    return text(value)
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      .replace(/[^A-Za-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();
  }

  function pascalPlural(value) {
    const name = text(value).trim();
    if (!name) return "";
    if (/[^aeiou]y$/i.test(name)) return `${name.slice(0, -1)}ies`;
    if (/(s|x|z|ch|sh)$/i.test(name)) return `${name}es`;
    return `${name}s`;
  }

  function splitList(value) {
    return text(value)
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return text(value) || "Unknown time";
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  }

  function deploymentIntentExpiry(value) {
    const expiresAt = new Date(value).getTime();
    return Number.isFinite(expiresAt) ? expiresAt : Number.NaN;
  }

  function currentDeploymentIntent() {
    const intent = model.deployIntent;
    if (!intent || intent.expiresAtMs <= Date.now()) return undefined;
    if (intent.profile !== dom.awsProfile.value.trim()) return undefined;
    if (intent.identifier !== dom.sandboxIdentifier.value.trim())
      return undefined;
    return intent;
  }

  function renderDeploymentIntent(intent) {
    dom.verifiedAccount.textContent = intent.account;
    dom.verifiedRegion.textContent = intent.region;
    dom.verifiedArn.textContent = intent.arn;
    dom.verifiedExpiry.dateTime = intent.expiresAt;
    dom.verifiedExpiry.textContent = formatDate(intent.expiresAt);
    dom.verifiedDeploymentTarget.hidden = false;
  }

  function invalidateDeploymentIntent({
    message,
    statusLabel = "Recheck required",
    status = "pending",
    update = true,
  } = {}) {
    const hadIntent = Boolean(model.deployIntent);
    clearTimeout(model.deployIntentTimer);
    model.deployIntentTimer = undefined;
    model.deployIntent = undefined;
    dom.verifiedDeploymentTarget.hidden = true;
    dom.verifiedAccount.textContent = "";
    dom.verifiedRegion.textContent = "";
    dom.verifiedArn.textContent = "";
    dom.verifiedExpiry.removeAttribute("datetime");
    dom.verifiedExpiry.textContent = "";
    if (hadIntent && message) {
      setStatus(dom.awsStatus, statusLabel, status);
      dom.awsResult.textContent = message;
    }
    if (update && model.initialized) updateMutationAvailability();
  }

  function saveDeploymentIntent(result, input) {
    const identity = result?.identity ?? {};
    const intent = {
      intentId: text(result?.intentId),
      profile: text(result?.profile ?? identity.profile),
      identifier: text(result?.identifier),
      account: text(result?.account ?? identity.account),
      arn: text(result?.arn ?? identity.arn),
      region: text(result?.region ?? identity.region),
      expiresAt: text(result?.expiresAt),
      expiresAtMs: deploymentIntentExpiry(result?.expiresAt),
    };
    const inputsStillMatch =
      input.profile === dom.awsProfile.value.trim() &&
      input.identifier === dom.sandboxIdentifier.value.trim();
    if (
      !intent.intentId ||
      !intent.account ||
      !intent.arn ||
      !intent.region ||
      !Number.isFinite(intent.expiresAtMs) ||
      intent.expiresAtMs <= Date.now() ||
      intent.profile !== input.profile ||
      intent.identifier !== input.identifier ||
      !inputsStillMatch
    ) {
      throw new StudioApiError(
        "AWS verification did not return a valid deployment intent for the current profile and identifier. Check access again.",
        { code: "CI_RESOURCE_STUDIO_INVALID_DEPLOYMENT_INTENT", status: 409 },
      );
    }

    clearTimeout(model.deployIntentTimer);
    model.deployIntent = intent;
    renderDeploymentIntent(intent);
    model.deployIntentTimer = setTimeout(
      () => {
        if (model.deployIntent?.intentId !== intent.intentId) return;
        invalidateDeploymentIntent({
          message:
            "The verified deployment intent expired. Check AWS access again before deploying.",
        });
      },
      Math.max(0, intent.expiresAtMs - Date.now()) + 25,
    );
    updateMutationAvailability();
    return intent;
  }

  function messageFromError(error) {
    if (!(error instanceof Error)) return "Resource Studio request failed.";
    if (Array.isArray(error.conflicts) && error.conflicts.length > 0) {
      const paths = error.conflicts
        .map((conflict) => conflict?.path)
        .filter(Boolean)
        .slice(0, 5);
      return paths.length > 0
        ? `${error.message} Conflicting files: ${paths.join(", ")}.`
        : error.message;
    }
    return error.message;
  }

  function setStatus(element, label, status) {
    element.textContent = label;
    element.dataset.status = status;
  }

  function setBusy(button, busy, busyLabel = "Working") {
    if (busy) {
      button.dataset.idleLabel = button.textContent.trim();
      button.dataset.busyLabel = busyLabel;
      button.dataset.busy = "true";
      button.textContent = busyLabel;
      button.disabled = true;
      return;
    }
    if (
      button.dataset.idleLabel &&
      button.textContent.trim() === button.dataset.busyLabel
    ) {
      button.textContent = button.dataset.idleLabel;
    }
    delete button.dataset.idleLabel;
    delete button.dataset.busyLabel;
    delete button.dataset.busy;
    button.disabled = false;
    updateMutationAvailability();
  }

  async function withBusy(button, busyLabel, work) {
    setBusy(button, true, busyLabel);
    try {
      return await work();
    } finally {
      setBusy(button, false);
    }
  }

  function showToast(message, tone = "success") {
    clearTimeout(model.toastTimer);
    dom.toast.textContent = message;
    dom.toast.dataset.tone = tone;
    dom.toast.hidden = false;
    model.toastTimer = setTimeout(() => {
      dom.toast.hidden = true;
    }, 5000);
  }

  function showFatal(error) {
    const message = messageFromError(error);
    dom.fatalMessage.textContent = message;
    dom.fatalPanel.hidden = false;
    setStatus(dom.sessionStatus, "Disconnected", "danger");
  }

  function clearFatal() {
    dom.fatalPanel.hidden = true;
    dom.fatalMessage.textContent = "";
  }

  async function readResponse(response) {
    let payload;
    try {
      payload = await response.json();
    } catch {
      payload = undefined;
    }
    if (response.ok) return payload;
    const detail = payload?.error;
    throw new StudioApiError(
      detail?.message ?? `Resource Studio returned HTTP ${response.status}.`,
      {
        code: detail?.code,
        status: response.status,
        conflicts: detail?.conflicts,
      },
    );
  }

  async function api(path, options = {}) {
    const method = options.method ?? "GET";
    const mutation = !["GET", "HEAD"].includes(method);
    if (mutation && !model.csrf) {
      throw new StudioApiError(
        "This page no longer has its in-memory authorization proof. Restart Resource Studio from the CLI to make changes.",
        { code: "CI_RESOURCE_STUDIO_CSRF_UNAVAILABLE", status: 401 },
      );
    }
    const headers = { Accept: "application/json" };
    if (mutation) headers["X-CI-CSRF"] = model.csrf;
    if (options.body !== undefined)
      headers["Content-Type"] = "application/json";
    const response = await fetch(path, {
      method,
      credentials: "same-origin",
      headers,
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    return readResponse(response);
  }

  function capabilityFieldTypes() {
    const configured = model.state?.capabilities?.fieldTypes;
    if (!Array.isArray(configured) || configured.length === 0) {
      return FALLBACK_FIELD_TYPES;
    }
    return configured
      .map((entry) => (typeof entry === "string" ? entry : entry?.id))
      .filter(Boolean);
  }

  function capabilityAuthStrategies() {
    const configured = model.state?.capabilities?.authorizationStrategies;
    return Array.isArray(configured) && configured.length > 0
      ? configured.filter((entry) => typeof entry === "string")
      : FALLBACK_AUTH_STRATEGIES;
  }

  function authorizationMetadata(strategy) {
    const configured = model.state?.capabilities?.authorizationRules;
    if (Array.isArray(configured)) {
      const match = configured.find((entry) => entry?.id === strategy);
      if (match) return match;
    }
    const fallback = {
      authenticated: { providers: ["userPools", "identityPool", "oidc"] },
      guest: { providers: [] },
      publicApiKey: { providers: [] },
      owner: { providers: ["userPools", "oidc"], identityClaim: true },
      ownerDefinedIn: {
        providers: ["userPools", "oidc"],
        field: "scalar-string",
        identityClaim: true,
      },
      ownersDefinedIn: {
        providers: ["userPools", "oidc"],
        field: "string-array",
        identityClaim: true,
      },
      group: {
        providers: ["userPools", "oidc"],
        groups: "one",
        groupClaim: true,
      },
      groups: {
        providers: ["userPools", "oidc"],
        groups: "one-or-more",
        groupClaim: true,
      },
      groupDefinedIn: {
        providers: ["userPools", "oidc"],
        field: "scalar-string",
        groupClaim: true,
      },
      groupsDefinedIn: {
        providers: ["userPools", "oidc"],
        field: "string-array",
        groupClaim: true,
      },
      custom: { providers: ["function"] },
    };
    return fallback[strategy] ?? { providers: FALLBACK_PROVIDERS };
  }

  function fillSelect(select, values, selected, { blankLabel } = {}) {
    select.replaceChildren();
    if (blankLabel !== undefined) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = blankLabel;
      select.append(option);
    }
    for (const value of values) {
      const option = document.createElement("option");
      const id = typeof value === "string" ? value : value.value;
      option.value = id;
      option.textContent = typeof value === "string" ? value : value.label;
      select.append(option);
    }
    if (
      selected &&
      !Array.from(select.options).some((option) => option.value === selected)
    ) {
      const unsupported = document.createElement("option");
      unsupported.value = selected;
      unsupported.textContent = selected;
      select.append(unsupported);
    }
    select.value = selected ?? "";
  }

  function renderSystemFields() {
    const fields = model.state?.capabilities?.systemFields;
    if (!Array.isArray(fields) || fields.length === 0) return;
    dom.systemFields.replaceChildren();
    for (const field of fields) {
      const wrapper = document.createElement("div");
      const name = document.createElement("dt");
      const detail = document.createElement("dd");
      name.textContent = text(field.name);
      detail.textContent = `${text(field.type)} · ${field.implicit ? "automatic" : field.required ? "required" : "optional"}`;
      wrapper.append(name, detail);
      dom.systemFields.append(wrapper);
    }
  }

  function renderWarnings() {
    const warnings = Array.isArray(model.state?.warnings)
      ? model.state.warnings
      : [];
    dom.warningList.replaceChildren();
    for (const warning of warnings) {
      const item = document.createElement("li");
      item.textContent = text(warning);
      dom.warningList.append(item);
    }
    dom.warningPanel.hidden = warnings.length === 0;
  }

  function renderSettings() {
    const settings = model.state?.settings ?? {};
    if (!model.initialized) {
      dom.awsProfile.value = text(settings.profile);
      dom.sandboxIdentifier.value = text(settings.sandboxIdentifier);
    }
    const runtime = settings.nodeRuntime;
    if (runtime) {
      const supported = runtime.supported !== false;
      const supportedMajors = Array.isArray(runtime.supportedMajors)
        ? runtime.supportedMajors.join(" or ")
        : "a supported LTS release";
      dom.nodeRuntimeNote.dataset.status = supported ? "ready" : "danger";
      dom.nodeRuntimeNote.textContent = supported
        ? `Node ${text(runtime.version)} is supported for deployment.`
        : `Deployment is disabled on Node ${text(runtime.version)}. Switch to supported Node LTS major ${supportedMajors}, then restart Resource Studio.`;
    } else {
      delete dom.nodeRuntimeNote.dataset.status;
      dom.nodeRuntimeNote.textContent =
        "Deployment requires a CloudIgniter-supported Node.js LTS runtime.";
    }
  }

  function renderEntityList() {
    const entities = Array.isArray(model.state?.entities)
      ? model.state.entities
      : [];
    dom.entityList.replaceChildren();
    for (const entity of entities) {
      const item = document.createElement("li");
      const button = document.createElement("button");
      const name = document.createElement("strong");
      const detail = document.createElement("small");
      button.type = "button";
      button.className = "entity-list__button";
      button.dataset.entityId = entity.id;
      button.dataset.searchText =
        `${entity.name} ${entity.pluralName} ${entity.id}`.toLowerCase();
      button.setAttribute(
        "aria-current",
        entity.id === model.selectedId ? "true" : "false",
      );
      name.textContent = text(entity.name);
      detail.textContent = `${text(entity.id)} · ${text(entity.scope)}`;
      button.append(name, detail);
      button.addEventListener("click", () =>
        editEntity(entity, { focus: true }),
      );
      item.append(button);
      dom.entityList.append(item);
    }
    dom.entityEmpty.hidden = entities.length !== 0;
    filterEntityList();
  }

  function filterEntityList() {
    const query = dom.entitySearch.value.trim().toLowerCase();
    for (const button of dom.entityList.querySelectorAll(
      ".entity-list__button",
    )) {
      button.parentElement.hidden =
        query !== "" && !button.dataset.searchText.includes(query);
    }
  }

  function renderHistory() {
    const history = Array.isArray(model.state?.history)
      ? model.state.history
      : [];
    dom.historyList.replaceChildren();
    for (const entry of history.slice(0, 6)) {
      const item = document.createElement("li");
      const title = document.createElement("strong");
      const state = document.createElement("small");
      const time = document.createElement("time");
      title.textContent = `${text(entry.operation)} · ${text(entry.entityId)}`;
      state.textContent = text(entry.status);
      time.dateTime = text(entry.appliedAt ?? entry.createdAt);
      time.textContent = formatDate(entry.appliedAt ?? entry.createdAt);
      item.append(title, state, time);
      dom.historyList.append(item);
    }
    dom.historyEmpty.hidden = history.length !== 0;
    dom.undoButton.disabled =
      !model.csrf || !history.some((entry) => entry.status === "applied");
  }

  function updateMutationAvailability() {
    const enabled = Boolean(model.csrf);
    const mutationButtons = [
      dom.saveEntityButton,
      dom.dropEntityButton,
      dom.undoButton,
      dom.preflightButton,
      dom.ssoButton,
      dom.deployButton,
      dom.shutdownButton,
    ];
    for (const button of mutationButtons) {
      if (button.dataset.busy === "true") continue;
      if (button === dom.dropEntityButton && !model.selectedId) continue;
      button.disabled = !enabled;
      button.title = enabled
        ? ""
        : "Restart Resource Studio from the CLI to authorize mutations in this page.";
    }
    if (dom.deployButton.dataset.busy !== "true") {
      const runtimeSupported =
        model.state?.settings?.nodeRuntime?.supported === true;
      const profileSelected = dom.awsProfile.value.trim() !== "";
      const intent = currentDeploymentIntent();
      dom.deployButton.disabled =
        !enabled || !runtimeSupported || !profileSelected || !intent;
      if (!runtimeSupported) {
        dom.deployButton.title =
          "Switch to a supported Node.js LTS runtime before deployment.";
      } else if (!profileSelected) {
        dom.deployButton.title =
          "Select an explicit AWS profile before deployment.";
      } else if (!intent) {
        dom.deployButton.title =
          "Check AWS access to verify a short-lived deployment target first.";
      } else {
        dom.deployButton.title = "";
      }
    }
    renderHistory();
  }

  function updateEntitySelection() {
    for (const button of dom.entityList.querySelectorAll(
      ".entity-list__button",
    )) {
      button.setAttribute(
        "aria-current",
        button.dataset.entityId === model.selectedId ? "true" : "false",
      );
    }
  }

  function ensureControlId(control) {
    if (!control.id) {
      model.controlSequence += 1;
      control.id = `studio-control-${model.controlSequence}`;
    }
    return control.id;
  }

  function clearControlError(control) {
    control.removeAttribute("aria-invalid");
    const errorId = control.dataset.errorId;
    if (errorId) document.getElementById(errorId)?.remove();
    delete control.dataset.errorId;
  }

  function setControlError(control, message) {
    clearControlError(control);
    const id = ensureControlId(control);
    const error = document.createElement("small");
    const errorId = `${id}-error`;
    error.id = errorId;
    error.className = "field-error";
    error.textContent = message;
    control.dataset.errorId = errorId;
    control.setAttribute("aria-invalid", "true");
    control.insertAdjacentElement("afterend", error);
  }

  function clearFormErrors() {
    for (const control of dom.form.querySelectorAll(
      "input, select, textarea",
    )) {
      control.setCustomValidity("");
      clearControlError(control);
    }
    dom.formErrorList.replaceChildren();
    dom.formErrors.hidden = true;
  }

  function setCustomValidity(control, message) {
    control.setCustomValidity(message);
    setControlError(control, message);
  }

  function validateControl(control) {
    clearControlError(control);
    if (!control.validity.valid)
      setControlError(control, control.validationMessage);
    return control.validity.valid;
  }

  function appendErrorSummary(control) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "error-link";
    button.textContent = control.validationMessage || "Review this field.";
    button.addEventListener("click", () => control.focus());
    item.append(button);
    dom.formErrorList.append(item);
  }

  function validateBusinessRules() {
    const path = dom.managementPath.value.trim();
    const reservedPrefixes = [
      "/api",
      "/ci-internal",
      "/ci-global",
      "/ci-tenant",
    ];
    if (
      reservedPrefixes.some(
        (prefix) => path === prefix || path.startsWith(`${prefix}/`),
      )
    ) {
      setCustomValidity(
        dom.managementPath,
        "Management route cannot use an API or CloudIgniter internal prefix.",
      );
    }

    const fieldRows = Array.from(dom.fieldsList.querySelectorAll(".field-row"));
    const names = new Map();
    for (const row of fieldRows) {
      const nameControl = row.querySelector(".field-name");
      const fieldName = nameControl.value.trim();
      if (RESERVED_FIELDS.has(fieldName)) {
        setCustomValidity(
          nameControl,
          `“${fieldName}” is managed by CloudIgniter.`,
        );
      } else if (fieldName && names.has(fieldName)) {
        setCustomValidity(
          nameControl,
          `Field name “${fieldName}” is repeated.`,
        );
        setCustomValidity(
          names.get(fieldName),
          `Field name “${fieldName}” is repeated.`,
        );
      } else if (fieldName) {
        names.set(fieldName, nameControl);
      }

      const min = row.querySelector(".validation-min-length");
      const max = row.querySelector(".validation-max-length");
      if (
        !min.disabled &&
        min.value !== "" &&
        max.value !== "" &&
        Number(min.value) > Number(max.value)
      ) {
        setCustomValidity(
          max,
          "Maximum length must be greater than or equal to minimum length.",
        );
      }
      const parsedDefault = parseFieldDefault(row);
      if (parsedDefault.error) {
        setCustomValidity(
          row.querySelector(".field-default"),
          parsedDefault.error,
        );
      }
    }

    for (const row of dom.authList.querySelectorAll(".auth-row")) {
      const strategy = row.querySelector(".auth-strategy").value;
      const groups = splitList(row.querySelector(".auth-groups").value);
      const fieldControl = row.querySelector(".auth-field");
      const operationControls = Array.from(
        row.querySelectorAll('.operations-fieldset input[type="checkbox"]'),
      );
      if (
        [
          "ownerDefinedIn",
          "ownersDefinedIn",
          "groupDefinedIn",
          "groupsDefinedIn",
        ].includes(strategy) &&
        !fieldControl.value.trim()
      ) {
        setCustomValidity(
          fieldControl,
          `${strategy} authorization requires a model field.`,
        );
      }
      const groupsControl = row.querySelector(".auth-groups");
      if (strategy === "group" && groups.length !== 1) {
        setCustomValidity(
          groupsControl,
          "group authorization requires exactly one group.",
        );
      }
      if (strategy === "groups" && groups.length === 0) {
        setCustomValidity(
          groupsControl,
          "groups authorization requires at least one group.",
        );
      }
      if (!operationControls.some((control) => control.checked)) {
        setCustomValidity(
          operationControls[0],
          "Select at least one allowed operation.",
        );
      }
    }

    const indexRows = Array.from(
      dom.indexesList.querySelectorAll(".index-row"),
    );
    const maxIndexes = Number(
      model.state?.capabilities?.secondaryIndexes?.maximumCustomIndexes ?? 19,
    );
    if (indexRows.length > maxIndexes) {
      setCustomValidity(
        indexRows[maxIndexes].querySelector(".index-name"),
        `A maximum of ${maxIndexes} custom indexes is supported.`,
      );
    }
    const indexNames = new Map();
    const queryFields = new Map();
    for (const row of indexRows) {
      const nameControl = row.querySelector(".index-name");
      const queryControl = row.querySelector(".index-query-field");
      const name = nameControl.value.trim();
      const query = queryControl.value.trim();
      if (name === "byScope")
        setCustomValidity(nameControl, "byScope is reserved by CloudIgniter.");
      if (name && indexNames.has(name)) {
        setCustomValidity(nameControl, `Index name “${name}” is repeated.`);
        setCustomValidity(
          indexNames.get(name),
          `Index name “${name}” is repeated.`,
        );
      } else if (name) indexNames.set(name, nameControl);
      if (query && queryFields.has(query)) {
        setCustomValidity(queryControl, `Query field “${query}” is repeated.`);
        setCustomValidity(
          queryFields.get(query),
          `Query field “${query}” is repeated.`,
        );
      } else if (query) queryFields.set(query, queryControl);
      if (
        row.querySelector(".index-projection").value === "INCLUDE" &&
        splitList(row.querySelector(".index-attributes").value).length === 0
      ) {
        setCustomValidity(
          row.querySelector(".index-attributes"),
          "INCLUDE projection requires at least one non-key attribute.",
        );
      }
    }
  }

  function validateForm() {
    clearFormErrors();
    validateBusinessRules();
    const invalid = Array.from(dom.form.querySelectorAll(":invalid"));
    for (const control of invalid) {
      validateControl(control);
      appendErrorSummary(control);
    }
    dom.formErrors.hidden = invalid.length === 0;
    if (invalid.length > 0) {
      invalid[0].focus();
      return false;
    }
    return true;
  }

  function formatDefaultValue(value) {
    if (value === undefined) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch {
        return text(value);
      }
    }
    return String(value);
  }

  function parseFieldDefault(row) {
    const control = row.querySelector(".field-default");
    const raw = control.value.trim();
    if (raw === "") return { present: false };
    const type = row.querySelector(".field-type").value;
    const array = row.querySelector(".field-array").checked;

    if (array || type === "AWSJSON") {
      try {
        const value = JSON.parse(raw);
        if (array && !Array.isArray(value)) {
          return { error: "Array defaults must be a JSON array." };
        }
        return { present: true, value };
      } catch {
        return {
          error: array
            ? "Array defaults must be valid JSON arrays."
            : "AWSJSON defaults must be valid JSON.",
        };
      }
    }

    if (type === "Boolean") {
      if (raw !== "true" && raw !== "false") {
        return { error: "Boolean defaults must be true or false." };
      }
      return { present: true, value: raw === "true" };
    }

    if (["Int", "Float", "AWSTimestamp"].includes(type)) {
      const value = Number(raw);
      if (!Number.isFinite(value)) {
        return { error: `${type} defaults must be finite numbers.` };
      }
      if (
        ["Int", "AWSTimestamp"].includes(type) &&
        !Number.isSafeInteger(value)
      ) {
        return { error: `${type} defaults must be safe integers.` };
      }
      return { present: true, value };
    }

    return { present: true, value: raw };
  }

  function renumberRows(container, singular) {
    const rows = Array.from(container.children);
    rows.forEach((row, index) => {
      row.querySelector(".row-number").textContent = String(index + 1);
      row.setAttribute("aria-label", `${singular} ${index + 1}`);
    });
    dom.fieldsEmpty.hidden = dom.fieldsList.children.length !== 0;
    dom.authEmpty.hidden = dom.authList.children.length !== 0;
    dom.indexesEmpty.hidden = dom.indexesList.children.length !== 0;
  }

  function syncFieldRow(row) {
    const type = row.querySelector(".field-type").value;
    const array = row.querySelector(".field-array").checked;
    const itemsRequired = row.querySelector(".field-items-required");
    itemsRequired.disabled = !array;
    if (!array) itemsRequired.checked = false;

    const stringControls = [
      ".validation-min-length",
      ".validation-max-length",
      ".validation-starts-with",
      ".validation-ends-with",
      ".validation-matches",
    ].map((selector) => row.querySelector(selector));
    const numberControls = [
      ".validation-gt",
      ".validation-gte",
      ".validation-lt",
      ".validation-lte",
    ].map((selector) => row.querySelector(selector));
    for (const control of stringControls)
      control.disabled = array || type !== "String";
    for (const control of numberControls) {
      control.disabled = array || !["Int", "Float"].includes(type);
    }
    const available = [...stringControls, ...numberControls].some(
      (control) => !control.disabled,
    );
    row.querySelector(".validation-disclosure").hidden = !available;
  }

  function updateFieldNameOptions() {
    const names = [
      ...FIELD_BASE_OPTIONS,
      ...Array.from(dom.fieldsList.querySelectorAll(".field-name"))
        .map((control) => control.value.trim())
        .filter(Boolean),
    ];
    dom.fieldNameOptions.replaceChildren();
    for (const name of [...new Set(names)]) {
      const option = document.createElement("option");
      option.value = name;
      dom.fieldNameOptions.append(option);
    }
  }

  function addField(field = {}, options = {}) {
    const row = dom.fieldTemplate.content.firstElementChild.cloneNode(true);
    const type = field.type ?? "String";
    fillSelect(row.querySelector(".field-type"), capabilityFieldTypes(), type);
    row.querySelector(".field-name").value = text(field.name);
    row.querySelector(".field-label").value = text(field.label);
    row.querySelector(".field-required").checked = field.required === true;
    row.querySelector(".field-array").checked = field.array === true;
    row.querySelector(".field-items-required").checked =
      field.itemsRequired === true;
    row.querySelector(".field-default").value = formatDefaultValue(
      field.defaultValue,
    );
    const validation = field.validation ?? {};
    const validationValues = {
      ".validation-min-length": validation.minLength,
      ".validation-max-length": validation.maxLength,
      ".validation-starts-with": validation.startsWith,
      ".validation-ends-with": validation.endsWith,
      ".validation-matches": validation.matches,
      ".validation-gt": validation.gt,
      ".validation-gte": validation.gte,
      ".validation-lt": validation.lt,
      ".validation-lte": validation.lte,
    };
    for (const [selector, value] of Object.entries(validationValues)) {
      row.querySelector(selector).value =
        value === undefined ? "" : String(value);
    }
    row.querySelector(".remove-row").addEventListener("click", () => {
      row.remove();
      renumberRows(dom.fieldsList, "Field");
      updateFieldNameOptions();
    });
    row
      .querySelector(".field-type")
      .addEventListener("change", () => syncFieldRow(row));
    row
      .querySelector(".field-array")
      .addEventListener("change", () => syncFieldRow(row));
    row
      .querySelector(".field-name")
      .addEventListener("input", updateFieldNameOptions);
    dom.fieldsList.append(row);
    syncFieldRow(row);
    renumberRows(dom.fieldsList, "Field");
    updateFieldNameOptions();
    if (options.focus) row.querySelector(".field-name").focus();
    return row;
  }

  function configureAuthRow(row, selectedProvider) {
    const strategy = row.querySelector(".auth-strategy").value;
    const metadata = authorizationMetadata(strategy);
    const providers = Array.isArray(metadata.providers)
      ? metadata.providers
      : [];
    const provider = row.querySelector(".auth-provider");
    fillSelect(provider, providers, selectedProvider ?? provider.value, {
      blankLabel: providers.length > 0 ? "Amplify default" : "Not applicable",
    });
    if (strategy === "custom" && !provider.value) provider.value = "function";
    row.querySelector(".auth-provider-wrap").hidden = providers.length === 0;
    row.querySelector(".auth-field-wrap").hidden = !metadata.field;
    row.querySelector(".auth-groups-wrap").hidden = !metadata.groups;
    row.querySelector(".auth-identity-claim-wrap").hidden =
      !metadata.identityClaim;
    row.querySelector(".auth-group-claim-wrap").hidden = !metadata.groupClaim;
  }

  function addAuthorization(rule = {}, options = {}) {
    const row = dom.authTemplate.content.firstElementChild.cloneNode(true);
    const strategy = rule.strategy ?? "authenticated";
    fillSelect(
      row.querySelector(".auth-strategy"),
      capabilityAuthStrategies(),
      strategy,
    );
    row.querySelector(".auth-field").value = text(rule.field);
    row.querySelector(".auth-groups").value = Array.isArray(rule.groups)
      ? rule.groups.join(", ")
      : "";
    row.querySelector(".auth-identity-claim").value = text(rule.identityClaim);
    row.querySelector(".auth-group-claim").value = text(rule.groupClaim);
    const operations = Array.isArray(rule.operations)
      ? rule.operations
      : FALLBACK_OPERATIONS;
    for (const checkbox of row.querySelectorAll(
      '.operations-fieldset input[type="checkbox"]',
    )) {
      checkbox.checked = operations.includes(checkbox.value);
    }
    configureAuthRow(row, rule.provider);
    row.querySelector(".auth-strategy").addEventListener("change", () => {
      configureAuthRow(row, "");
    });
    row.querySelector(".remove-row").addEventListener("click", () => {
      row.remove();
      renumberRows(dom.authList, "Authorization rule");
    });
    dom.authList.append(row);
    renumberRows(dom.authList, "Authorization rule");
    if (options.focus) row.querySelector(".auth-strategy").focus();
    return row;
  }

  function syncIndexRow(row) {
    const include = row.querySelector(".index-projection").value === "INCLUDE";
    row.querySelector(".index-attributes-wrap").hidden = !include;
  }

  function addIndex(index = {}, options = {}) {
    const maximum = Number(
      model.state?.capabilities?.secondaryIndexes?.maximumCustomIndexes ?? 19,
    );
    if (dom.indexesList.children.length >= maximum) {
      showToast(
        `A maximum of ${maximum} custom indexes is supported.`,
        "warning",
      );
      return undefined;
    }
    const row = dom.indexTemplate.content.firstElementChild.cloneNode(true);
    row.querySelector(".index-name").value = text(index.name);
    row.querySelector(".index-query-field").value = text(index.queryField);
    row.querySelector(".index-partition-key").value = text(index.partitionKey);
    row.querySelector(".index-sort-keys").value = Array.isArray(index.sortKeys)
      ? index.sortKeys.join(", ")
      : "";
    row.querySelector(".index-projection").value = index.projection ?? "ALL";
    row.querySelector(".index-attributes").value = Array.isArray(
      index.nonKeyAttributes,
    )
      ? index.nonKeyAttributes.join(", ")
      : "";
    row
      .querySelector(".index-projection")
      .addEventListener("change", () => syncIndexRow(row));
    row.querySelector(".remove-row").addEventListener("click", () => {
      row.remove();
      renumberRows(dom.indexesList, "Secondary index");
      dom.addIndexButton.disabled = false;
    });
    dom.indexesList.append(row);
    syncIndexRow(row);
    renumberRows(dom.indexesList, "Secondary index");
    dom.addIndexButton.disabled = dom.indexesList.children.length >= maximum;
    if (options.focus) row.querySelector(".index-name").focus();
    return row;
  }

  function resetRepeaters() {
    dom.fieldsList.replaceChildren();
    dom.authList.replaceChildren();
    dom.indexesList.replaceChildren();
    renumberRows(dom.fieldsList, "Field");
    renumberRows(dom.authList, "Authorization rule");
    renumberRows(dom.indexesList, "Secondary index");
    dom.addIndexButton.disabled = false;
    updateFieldNameOptions();
  }

  function defaultAuthorizationRule() {
    return {
      strategy: "groups",
      provider: "userPools",
      groups: ["system-super-admin", "system-admin"],
      operations: [...FALLBACK_OPERATIONS],
    };
  }

  function startNewEntity(options = {}) {
    model.hydrating = true;
    model.selectedId = undefined;
    dom.form.reset();
    clearFormErrors();
    resetRepeaters();
    dom.scope.value = "tenant";
    dom.entityId.readOnly = false;
    dom.editorMode.textContent = "Create resource";
    dom.editorHeading.textContent = "New Data Entity";
    dom.saveEntityButton.textContent = "Create Data Entity";
    dom.dropEntityButton.hidden = true;
    addField();
    addAuthorization(defaultAuthorizationRule());
    model.routeTouched = false;
    model.pluralTouched = false;
    model.idTouched = false;
    model.titleTouched = false;
    model.hydrating = false;
    updateEntitySelection();
    updateMutationAvailability();
    if (options.focus) dom.entityName.focus();
  }

  function editEntity(entity, options = {}) {
    if (!entity) return;
    model.hydrating = true;
    model.selectedId = entity.id;
    dom.form.reset();
    clearFormErrors();
    resetRepeaters();
    dom.entityId.value = text(entity.id);
    dom.entityId.readOnly = true;
    dom.entityName.value = text(entity.name);
    dom.pluralName.value = text(entity.pluralName);
    dom.scope.value = entity.scope === "global" ? "global" : "tenant";
    dom.description.value = text(entity.description);
    dom.managementPath.value = text(entity.managementPage?.path);
    dom.managementTitle.value = text(entity.managementPage?.title);
    for (const field of Array.isArray(entity.fields) ? entity.fields : [])
      addField(field);
    for (const rule of Array.isArray(entity.authorization)
      ? entity.authorization
      : []) {
      addAuthorization(rule);
    }
    for (const index of Array.isArray(entity.secondaryIndexes)
      ? entity.secondaryIndexes
      : []) {
      addIndex(index);
    }
    dom.editorMode.textContent = "Manage resource";
    dom.editorHeading.textContent = text(entity.name);
    dom.saveEntityButton.textContent = "Save changes";
    dom.dropEntityButton.hidden = false;
    model.routeTouched = true;
    model.pluralTouched = true;
    model.idTouched = true;
    model.titleTouched = true;
    model.hydrating = false;
    updateEntitySelection();
    updateMutationAvailability();
    if (options.focus) {
      document.querySelector("#studio-main").focus();
      dom.entityName.focus();
    }
  }

  function refreshDerivedIdentity() {
    if (model.hydrating || model.selectedId) return;
    const name = dom.entityName.value.trim();
    if (!model.idTouched) dom.entityId.value = kebabCase(name);
    if (!model.pluralTouched) dom.pluralName.value = pascalPlural(name);
    refreshDerivedRoute();
  }

  function refreshDerivedRoute() {
    if (model.hydrating || model.selectedId) return;
    const plural = dom.pluralName.value.trim();
    if (!model.routeTouched) {
      const slug = kebabCase(plural);
      dom.managementPath.value = slug ? `/dashboard/${slug}` : "";
    }
    if (!model.titleTouched) {
      const words = wordsFromIdentifier(plural);
      dom.managementTitle.value = words ? `Manage ${words}` : "";
    }
  }

  function readValidation(row) {
    const output = {};
    const mappings = [
      ["minLength", ".validation-min-length", "number"],
      ["maxLength", ".validation-max-length", "number"],
      ["startsWith", ".validation-starts-with", "string"],
      ["endsWith", ".validation-ends-with", "string"],
      ["matches", ".validation-matches", "string"],
      ["gt", ".validation-gt", "number"],
      ["gte", ".validation-gte", "number"],
      ["lt", ".validation-lt", "number"],
      ["lte", ".validation-lte", "number"],
    ];
    for (const [key, selector, kind] of mappings) {
      const control = row.querySelector(selector);
      if (control.disabled || control.value === "") continue;
      output[key] = kind === "number" ? Number(control.value) : control.value;
    }
    return Object.keys(output).length > 0 ? output : undefined;
  }

  function descriptorFromForm() {
    const fields = Array.from(
      dom.fieldsList.querySelectorAll(".field-row"),
    ).map((row) => {
      const field = {
        name: row.querySelector(".field-name").value.trim(),
        label: row.querySelector(".field-label").value.trim(),
        type: row.querySelector(".field-type").value,
        required: row.querySelector(".field-required").checked,
        array: row.querySelector(".field-array").checked,
        itemsRequired: row.querySelector(".field-items-required").checked,
      };
      const parsedDefault = parseFieldDefault(row);
      if (parsedDefault.present) field.defaultValue = parsedDefault.value;
      const validation = readValidation(row);
      if (validation) field.validation = validation;
      return field;
    });

    const authorization = Array.from(
      dom.authList.querySelectorAll(".auth-row"),
    ).map((row) => {
      const strategy = row.querySelector(".auth-strategy").value;
      const metadata = authorizationMetadata(strategy);
      const rule = {
        strategy,
        operations: Array.from(
          row.querySelectorAll(
            '.operations-fieldset input[type="checkbox"]:checked',
          ),
        ).map((control) => control.value),
      };
      const provider = row.querySelector(".auth-provider").value;
      const field = row.querySelector(".auth-field").value.trim();
      const groups = splitList(row.querySelector(".auth-groups").value);
      const identityClaim = row
        .querySelector(".auth-identity-claim")
        .value.trim();
      const groupClaim = row.querySelector(".auth-group-claim").value.trim();
      if (
        provider &&
        Array.isArray(metadata.providers) &&
        metadata.providers.length > 0
      ) {
        rule.provider = provider;
      }
      if (field && metadata.field) rule.field = field;
      if (groups.length > 0 && metadata.groups) rule.groups = groups;
      if (identityClaim && metadata.identityClaim)
        rule.identityClaim = identityClaim;
      if (groupClaim && metadata.groupClaim) rule.groupClaim = groupClaim;
      return rule;
    });

    const secondaryIndexes = Array.from(
      dom.indexesList.querySelectorAll(".index-row"),
    ).map((row) => {
      const projection = row.querySelector(".index-projection").value;
      return {
        name: row.querySelector(".index-name").value.trim(),
        queryField: row.querySelector(".index-query-field").value.trim(),
        partitionKey: row.querySelector(".index-partition-key").value.trim(),
        sortKeys: splitList(row.querySelector(".index-sort-keys").value),
        projection,
        nonKeyAttributes:
          projection === "INCLUDE"
            ? splitList(row.querySelector(".index-attributes").value)
            : [],
      };
    });

    const name = dom.entityName.value.trim();
    return {
      schemaVersion: 1,
      kind: "data-entity",
      provider: "aws-amplify",
      id: dom.entityId.value.trim(),
      name,
      pluralName: dom.pluralName.value.trim(),
      scope: dom.scope.value,
      description: dom.description.value.trim(),
      dataStore: {
        mode: "managed-model",
        modelName: name,
        identifier: ["PK", "SK"],
      },
      managementPage: {
        path: dom.managementPath.value.trim(),
        title: dom.managementTitle.value.trim(),
      },
      fields,
      authorization,
      secondaryIndexes,
    };
  }

  async function saveEntity(event) {
    event.preventDefault();
    if (!validateForm()) return;
    const descriptor = descriptorFromForm();
    const editingId = model.selectedId;
    await withBusy(
      dom.saveEntityButton,
      editingId ? "Saving" : "Creating",
      async () => {
        try {
          const result = await api(
            editingId
              ? `/api/entities/${encodeURIComponent(editingId)}`
              : "/api/entities",
            {
              method: editingId ? "PUT" : "POST",
              body: descriptor,
            },
          );
          model.selectedId = descriptor.id;
          await refreshState({ selectId: descriptor.id });
          const action = editingId ? "updated" : "created";
          showToast(
            result.transactionId
              ? `${descriptor.name} ${action}. Local transaction ${result.transactionId} is available to undo.`
              : `${descriptor.name} is already up to date.`,
          );
        } catch (error) {
          showToast(messageFromError(error), "danger");
        }
      },
    );
  }

  function openConfirmation({ title, message, actionLabel, action }) {
    model.pendingConfirmation = action;
    dom.confirmTitle.textContent = title;
    dom.confirmMessage.textContent = message;
    dom.confirmAction.textContent = actionLabel;
    dom.confirmDialog.returnValue = "";
    dom.confirmDialog.showModal();
  }

  function requestDropEntity() {
    const entity = model.state?.entities?.find(
      (item) => item.id === model.selectedId,
    );
    if (!entity) return;
    openConfirmation({
      title: `Drop ${entity.name}?`,
      message:
        "This removes the Data Entity’s generated local artifacts through a recorded transaction. Undo can restore the exact local files. Deployed AWS resources change only after another explicit one-shot deploy.",
      actionLabel: "Drop Data Entity",
      action: async () => {
        await withBusy(dom.dropEntityButton, "Dropping", async () => {
          try {
            const result = await api(
              `/api/entities/${encodeURIComponent(entity.id)}`,
              {
                method: "DELETE",
              },
            );
            await refreshState({ selectId: undefined, preferFirst: false });
            showToast(
              `${entity.name} was dropped locally${result.transactionId ? ` in transaction ${result.transactionId}` : ""}. Use Undo latest local change to restore it.`,
            );
          } catch (error) {
            showToast(messageFromError(error), "danger");
          }
        });
      },
    });
  }

  function requestUndo() {
    const target = model.state?.history?.find(
      (entry) => entry.status === "applied",
    );
    if (!target) return;
    openConfirmation({
      title: "Undo latest local change?",
      message: `This restores the exact local files from the ${text(target.operation)} transaction for ${text(target.entityId)}. It does not roll back deployed AWS resources; deploy the restored plan explicitly if needed.`,
      actionLabel: "Undo local change",
      action: async () => {
        await withBusy(dom.undoButton, "Restoring", async () => {
          try {
            const result = await api("/api/undo", {
              method: "POST",
              body: { transactionId: target.transactionId },
            });
            await refreshState({
              selectId: target.entityId,
              preferFirst: false,
            });
            showToast(
              `Local transaction ${result.transactionId} was restored exactly.`,
            );
          } catch (error) {
            showToast(messageFromError(error), "danger");
          }
        });
      },
    });
  }

  function awsInput() {
    const profile = dom.awsProfile.value.trim();
    const identifier = dom.sandboxIdentifier.value.trim();
    if (!profile) {
      setControlError(dom.awsProfile, "Select an explicit AWS profile first.");
      dom.awsProfile.focus();
      throw new Error("Select an explicit AWS profile first.");
    }
    if (!/^[A-Za-z0-9-]{1,15}$/.test(identifier)) {
      setControlError(
        dom.sandboxIdentifier,
        "Use 1–15 letters, numbers, or hyphens for the sandbox identifier.",
      );
      dom.sandboxIdentifier.focus();
      throw new Error("Enter a valid Amplify sandbox identifier.");
    }
    clearControlError(dom.awsProfile);
    clearControlError(dom.sandboxIdentifier);
    return { profile, identifier };
  }

  async function preflightAws() {
    await withBusy(dom.preflightButton, "Checking", async () => {
      try {
        const input = awsInput();
        invalidateDeploymentIntent();
        setStatus(dom.awsStatus, "Checking", "pending");
        dom.awsResult.textContent = `Running AWS STS preflight for ${input.profile} and sandbox ${input.identifier}.`;
        const result = await api("/api/aws/preflight", {
          method: "POST",
          body: input,
        });
        const intent = saveDeploymentIntent(result, input);
        setStatus(dom.awsStatus, "Access ready", "success");
        dom.awsResult.textContent = `Verified account ${intent.account} in ${intent.region} for profile ${intent.profile} and sandbox ${intent.identifier}. Intent expires ${formatDate(intent.expiresAt)}.`;
        await refreshLogs();
      } catch (error) {
        invalidateDeploymentIntent();
        setStatus(dom.awsStatus, "Access needs attention", "danger");
        dom.awsResult.textContent = messageFromError(error);
        showToast(messageFromError(error), "danger");
        await refreshLogs().catch(() => undefined);
      }
    });
  }

  async function refreshSso() {
    await withBusy(dom.ssoButton, "Waiting for SSO", async () => {
      try {
        const input = awsInput();
        invalidateDeploymentIntent();
        setStatus(dom.awsStatus, "SSO login running", "pending");
        dom.awsResult.textContent =
          "Complete the AWS SSO browser or terminal flow opened by the CloudIgniter CLI.";
        const result = await api("/api/aws/sso-login", {
          method: "POST",
          body: { profile: input.profile, identifier: input.identifier },
        });
        const intent = saveDeploymentIntent(result, input);
        setStatus(dom.awsStatus, "SSO and access ready", "success");
        dom.awsResult.textContent = `SSO refreshed and account ${intent.account} verified in ${intent.region} for profile ${intent.profile} and sandbox ${intent.identifier}. Intent expires ${formatDate(intent.expiresAt)}.`;
        await refreshLogs();
      } catch (error) {
        invalidateDeploymentIntent();
        setStatus(dom.awsStatus, "SSO login failed", "danger");
        dom.awsResult.textContent = messageFromError(error);
        showToast(messageFromError(error), "danger");
        await refreshLogs().catch(() => undefined);
      }
    });
  }

  async function deploySandbox(expectedIntent) {
    await withBusy(dom.deployButton, "Deploying once", async () => {
      try {
        const input = awsInput();
        const intent = currentDeploymentIntent();
        if (!intent || intent.intentId !== expectedIntent.intentId) {
          invalidateDeploymentIntent();
          throw new StudioApiError(
            "The verified deployment target changed or expired. Check AWS access again.",
            {
              code: "CI_RESOURCE_STUDIO_DEPLOYMENT_INTENT_EXPIRED",
              status: 409,
            },
          );
        }
        setStatus(dom.awsStatus, "Deploying", "pending");
        dom.awsResult.textContent = `Rechecking verified account ${intent.account} in ${intent.region}, then running ampx sandbox --once for ${input.identifier}.`;
        let result;
        try {
          result = await api("/api/sandbox/deploy", {
            method: "POST",
            body: { ...input, intentId: intent.intentId },
          });
        } finally {
          invalidateDeploymentIntent({ update: false });
        }
        setStatus(dom.awsStatus, "Deploy completed", "success");
        dom.awsResult.textContent = `One-shot sandbox ${text(result.identifier)} completed with profile ${text(result.profile)}.`;
        showToast(`Amplify sandbox ${text(result.identifier)} deployed once.`);
        await refreshLogs();
      } catch (error) {
        setStatus(dom.awsStatus, "Deploy failed", "danger");
        dom.awsResult.textContent = `${messageFromError(error)} Generated source remains in place so you can correct the issue and run a compensating one-shot deploy.`;
        showToast(messageFromError(error), "danger");
        await refreshLogs().catch(() => undefined);
      }
    });
  }

  function requestDeploy() {
    let input;
    try {
      input = awsInput();
    } catch (error) {
      showToast(messageFromError(error), "danger");
      return;
    }
    const intent = currentDeploymentIntent();
    if (!intent) {
      invalidateDeploymentIntent({
        message:
          "Check AWS access to verify the exact account, region, profile, identifier, and current generated plan before deploying.",
      });
      showToast("Check AWS access before deploying.", "warning");
      return;
    }
    openConfirmation({
      title: `Deploy sandbox ${input.identifier}?`,
      message: `Deploy the current generated plan to verified AWS account ${intent.account}, caller ${intent.arn}, region ${intent.region}, using profile ${intent.profile} and sandbox identifier ${intent.identifier}? CloudIgniter will recheck this exact target before one explicit Amplify sandbox deployment. This changes AWS resources and is not reversed by local file undo.`,
      actionLabel: "Deploy once",
      action: () => deploySandbox(intent),
    });
  }

  async function refreshLogs() {
    return withBusy(dom.refreshLogsButton, "Refreshing", async () => {
      const result = await api("/api/logs");
      const logs = Array.isArray(result?.logs)
        ? [...result.logs].reverse()
        : [];
      dom.activityList.replaceChildren();
      for (const event of logs) {
        const item = document.createElement("li");
        const time = document.createElement("time");
        const type = document.createElement("span");
        const message = document.createElement("span");
        time.dateTime = text(event.timestamp);
        time.textContent = formatDate(event.timestamp);
        type.className = "activity-type";
        type.textContent = `${text(event.type || "event")} · ${text(event.status || "recorded")}`;
        message.className = "activity-message";
        message.textContent = text(event.message);
        item.append(time, type, message);
        dom.activityList.append(item);
      }
      dom.activityEmpty.hidden = logs.length !== 0;
      return logs;
    });
  }

  async function refreshState(options = {}) {
    invalidateDeploymentIntent({
      message:
        "The local generated plan was refreshed. Check AWS access again before deployment.",
    });
    const state = await api("/api/state");
    model.state = state;
    const entities = Array.isArray(state.entities) ? state.entities : [];
    let selectedId = options.selectId ?? model.selectedId;
    let selected = entities.find((entity) => entity.id === selectedId);
    if (!selected && options.preferFirst !== false && entities.length > 0)
      selected = entities[0];
    if (selected) model.selectedId = selected.id;
    else model.selectedId = undefined;
    renderSystemFields();
    renderWarnings();
    renderSettings();
    renderEntityList();
    renderHistory();
    if (selected) editEntity(selected);
    else startNewEntity();
    model.initialized = true;
    updateMutationAvailability();
    return state;
  }

  async function establishSession() {
    clearFatal();
    setStatus(dom.sessionStatus, "Connecting", "pending");
    let bootstrapToken;
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    if (fragment.has("token")) bootstrapToken = fragment.get("token");
    if (window.location.hash) {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}`,
      );
    }

    let exchangeError;
    if (bootstrapToken) {
      try {
        const response = await fetch("/api/session", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            Authorization: `Bearer ${bootstrapToken}`,
            Accept: "application/json",
          },
        });
        const result = await readResponse(response);
        model.csrf = result?.csrf;
      } catch (error) {
        exchangeError = error;
      } finally {
        bootstrapToken = undefined;
      }
    }

    try {
      await refreshState();
      await refreshLogs();
      if (model.csrf) {
        setStatus(dom.sessionStatus, "Local session ready", "ready");
      } else {
        setStatus(dom.sessionStatus, "Read-only session", "neutral");
        showToast(
          "Restart Resource Studio from the CLI to authorize changes; no access token is stored in the page.",
          "warning",
        );
      }
      clearFatal();
    } catch (error) {
      throw exchangeError ?? error;
    }
  }

  function requestShutdown() {
    openConfirmation({
      title: "Close Resource Studio?",
      message:
        "The localhost server will stop. Saved local transactions remain available the next time you start Resource Studio; unsaved form changes will be lost.",
      actionLabel: "Close Studio",
      action: async () => {
        try {
          await api("/api/shutdown", { method: "POST", body: {} });
          model.csrf = undefined;
          setStatus(dom.sessionStatus, "Server closed", "neutral");
          showToast("Resource Studio server closed.");
          updateMutationAvailability();
        } catch (error) {
          showToast(messageFromError(error), "danger");
        }
      },
    });
  }

  function deploymentInputChanged() {
    if (model.deployIntent) {
      invalidateDeploymentIntent({
        message:
          "The AWS profile or sandbox identifier changed. Check AWS access again before deploying.",
      });
      return;
    }
    updateMutationAvailability();
  }

  function wireEvents() {
    dom.newEntityButton.addEventListener("click", () =>
      startNewEntity({ focus: true }),
    );
    dom.entitySearch.addEventListener("input", filterEntityList);
    dom.form.addEventListener("submit", saveEntity);
    dom.form.addEventListener("focusout", (event) => {
      const control = event.target.closest("input, select, textarea");
      if (control && dom.form.contains(control)) validateControl(control);
    });
    dom.form.addEventListener("input", (event) => {
      const control = event.target.closest("input, select, textarea");
      if (control) {
        control.setCustomValidity("");
        clearControlError(control);
      }
    });
    dom.entityName.addEventListener("input", refreshDerivedIdentity);
    dom.entityId.addEventListener("input", () => {
      if (!model.hydrating) model.idTouched = true;
    });
    dom.pluralName.addEventListener("input", () => {
      if (!model.hydrating) model.pluralTouched = true;
      refreshDerivedRoute();
    });
    dom.managementPath.addEventListener("input", () => {
      if (!model.hydrating) model.routeTouched = true;
    });
    dom.managementTitle.addEventListener("input", () => {
      if (!model.hydrating) model.titleTouched = true;
    });
    dom.addFieldButton.addEventListener("click", () =>
      addField({}, { focus: true }),
    );
    dom.addAuthButton.addEventListener("click", () =>
      addAuthorization({}, { focus: true }),
    );
    dom.addIndexButton.addEventListener("click", () =>
      addIndex({}, { focus: true }),
    );
    dom.resetFormButton.addEventListener("click", () => {
      const entity = model.state?.entities?.find(
        (item) => item.id === model.selectedId,
      );
      if (entity) editEntity(entity, { focus: true });
      else startNewEntity({ focus: true });
      showToast("Unsaved form changes were reset.", "warning");
    });
    dom.dropEntityButton.addEventListener("click", requestDropEntity);
    dom.undoButton.addEventListener("click", requestUndo);
    dom.preflightButton.addEventListener("click", preflightAws);
    dom.ssoButton.addEventListener("click", refreshSso);
    dom.deployButton.addEventListener("click", requestDeploy);
    dom.awsProfile.addEventListener("input", deploymentInputChanged);
    dom.sandboxIdentifier.addEventListener("input", deploymentInputChanged);
    dom.refreshLogsButton.addEventListener("click", () => {
      refreshLogs().catch((error) =>
        showToast(messageFromError(error), "danger"),
      );
    });
    dom.shutdownButton.addEventListener("click", requestShutdown);
    dom.retryButton.addEventListener("click", () => {
      establishSession().catch(showFatal);
    });
    dom.confirmDialog.addEventListener("close", () => {
      const action = model.pendingConfirmation;
      model.pendingConfirmation = undefined;
      if (dom.confirmDialog.returnValue === "confirm" && action) {
        Promise.resolve(action()).catch((error) =>
          showToast(messageFromError(error), "danger"),
        );
      }
    });
  }

  wireEvents();
  startNewEntity();
  establishSession().catch(showFatal);
})();
