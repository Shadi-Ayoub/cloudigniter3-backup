import * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";
import "monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution.js";
import "monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution.js";
import "monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution.js";
import "monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution.js";
import "monaco-editor/esm/vs/basic-languages/css/css.contribution.js";
import "monaco-editor/esm/vs/basic-languages/html/html.contribution.js";
import "monaco-editor/esm/vs/basic-languages/xml/xml.contribution.js";
import "monaco-editor/esm/vs/basic-languages/shell/shell.contribution.js";
import "monaco-editor/esm/vs/basic-languages/ini/ini.contribution.js";
import "monaco-editor/esm/vs/basic-languages/dockerfile/dockerfile.contribution.js";
import { jsonDefaults } from "monaco-editor/esm/vs/language/json/monaco.contribution.js";

// Configuration editing needs token colors, not a remote language/schema service.
jsonDefaults.setModeConfiguration({ tokens: true });
globalThis.MonacoEnvironment = {
  getWorker: () => new Worker("/editor/editor.worker.js", { type: "module" }),
};

export function setTheme(theme) {
  monaco.editor.setTheme(theme === "dark" ? "vs-dark" : "vs");
}

function editorLanguage(file) {
  const name = file.split("/").pop().toLowerCase();
  const extension = name.includes(".") ? `.${name.split(".").pop()}` : "";
  return [".json", ".jsonc"].includes(extension)
    ? "json"
    : extension === ".mdx"
      ? "markdown"
      : (monaco.languages
          .getLanguages()
          .find(
            (entry) =>
              entry.filenames?.some(
                (filename) => filename.toLowerCase() === name,
              ) || entry.extensions?.includes(extension),
          )?.id ?? "plaintext");
}

function editorOptions() {
  return {
    automaticLayout: true,
    lineNumbers: "off",
    folding: true,
    minimap: { enabled: false },
    stickyScroll: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 13,
    lineHeight: 21,
    wordWrap: "on",
    tabSize: 2,
    insertSpaces: true,
    quickSuggestions: false,
    suggestOnTriggerCharacters: false,
    wordBasedSuggestions: "off",
    parameterHints: { enabled: false },
    hover: { enabled: false },
    links: false,
    renderValidationDecorations: "off",
    padding: { top: 12, bottom: 12 },
  };
}

export function createEditor(container, { file, content, onChange }) {
  let model = monaco.editor.createModel(content, editorLanguage(file));
  const instance = monaco.editor.create(container, {
    ...editorOptions(),
    model,
    ariaLabel: `Edit ${file}`,
  });
  const subscription = instance.onDidChangeModelContent(onChange);
  return {
    getValue: () =>
      model.getValue(monaco.editor.EndOfLinePreference.TextDefined),
    focus: () => instance.focus(),
    setReadOnly: (readOnly) => instance.updateOptions({ readOnly }),
    setDocument: ({ file, content }) => {
      const previous = model;
      model = monaco.editor.createModel(content, editorLanguage(file));
      instance.setModel(model);
      instance.updateOptions({ ariaLabel: `Edit ${file}` });
      previous.dispose();
    },
    dispose: () => {
      subscription.dispose();
      instance.dispose();
      model.dispose();
    },
  };
}

export function createReview(container, { file, original, modified }) {
  const language = editorLanguage(file);
  const before = monaco.editor.createModel(original, language);
  const after = monaco.editor.createModel(modified, language);
  const instance = monaco.editor.createDiffEditor(container, {
    ...editorOptions(),
    ariaLabel: `Review changes to ${file}`,
    originalAriaLabel: `Saved ${file}`,
    modifiedAriaLabel: `Proposed ${file}`,
    readOnly: true,
    originalEditable: false,
    renderSideBySide: false,
    renderIndicators: true,
    renderMarginRevertIcon: false,
    renderGutterMenu: false,
    renderOverviewRuler: false,
    ignoreTrimWhitespace: false,
    diffWordWrap: "on",
    hideUnchangedRegions: { enabled: true, contextLineCount: 3 },
  });
  let resolveReady;
  const ready = new Promise((resolve) => {
    resolveReady = resolve;
  });
  const subscription = instance.onDidUpdateDiff(() => {
    subscription.dispose();
    resolveReady(true);
  });
  instance.setModel({ original: before, modified: after });
  return {
    ready,
    dispose: () => {
      subscription.dispose();
      resolveReady(false);
      instance.dispose();
      before.dispose();
      after.dispose();
    },
  };
}
