"use client";

import * as React from "react";
import Editor from "@monaco-editor/react";
import type * as monacoNS from "monaco-editor";
import { RefreshCw, Trash2, ListTree } from "lucide-react";
import { Button, useCiMonacoTheme } from "@/ui";
import type { CiDevBeaconTraceLogViewerTextProps } from "../../types";

const safeFetchText = async (url: string, init?: RequestInit) => {
  const res = await fetch(url, { cache: "no-store", ...init });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}…`);
  }
  // Accept any content-type; treat body as text
  return res.text();
};

export function CiDevBeaconTraceLogViewerText({
  endpoint = "/ci-internal/trace",
  pollMs = 1500,
  tailBytes = 131072, // 128 KiB
  maxLines = 2000,
  autoStart = true,
  height = "420px",
  autoScroll = true,
  wordWrap = "off",
}: CiDevBeaconTraceLogViewerTextProps) {
  const theme = useCiMonacoTheme();
  const [isMounted, setIsMounted] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [auto, setAuto] = React.useState(autoStart);
  const [err, setErr] = React.useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = React.useState<number | null>(null);
  const [text, setText] = React.useState<string>("");

  // const editorRef = React.useRef<any>(null);
  const abortRef = React.useRef<AbortController | null>(null);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  // …component state…
  const editorRef = React.useRef<monacoNS.editor.IStandaloneCodeEditor | null>(
    null,
  );
  const monacoRef = React.useRef<typeof import("monaco-editor") | null>(null);
  const decoRef =
    React.useRef<monacoNS.editor.IEditorDecorationsCollection | null>(null);

  React.useEffect(() => setIsMounted(true), []);

  // NEW: add after your existing callbacks
  const applyDecorations = React.useCallback(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const model = editor.getModel?.();
    if (!model) return;

    const decorations: monacoNS.editor.IModelDeltaDecoration[] = [];

    // Already present in your file:
    const waveLineRe = /^#\s*=====.*?WAVE.*?=====/;
    const componentRe = /<[^>\n]+>/g;
    const funcRe = /\b[A-Za-z_][\w.$-]*\s*\([^)]*\)/g;

    // NEW: capture the value of "component": "…"
    // Handles escaped quotes inside the string value.
    const componentValueRe = /"component"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/g;

    const total = model.getLineCount();
    for (let ln = 1; ln <= total; ln++) {
      const lineText = model.getLineContent(ln);

      // WAVE line (unchanged)
      if (waveLineRe.test(lineText)) {
        decorations.push({
          range: new monaco.Range(ln, 1, ln, lineText.length + 1),
          options: { isWholeLine: true, className: "ci-log-wave-line" },
        });
        decorations.push({
          range: new monaco.Range(ln, 1, ln, lineText.length + 1),
          options: { inlineClassName: "ci-log-wave" },
        });
      }

      // <Component …> (unchanged)
      for (const m of lineText.matchAll(componentRe)) {
        const start = (m.index ?? 0) + 1;
        const end = start + m[0].length;
        decorations.push({
          range: new monaco.Range(ln, start, ln, end),
          options: { inlineClassName: "ci-log-component" },
        });
      }

      // functionName(...) (unchanged)
      for (const m of lineText.matchAll(funcRe)) {
        const start = (m.index ?? 0) + 1;
        const end = start + m[0].length;
        decorations.push({
          range: new monaco.Range(ln, start, ln, end),
          options: { inlineClassName: "ci-log-func" },
        });
      }

      // NEW: highlight value of "component": "…"
      for (const m of lineText.matchAll(componentValueRe)) {
        const whole = m[0]; // full `"component": "…"`
        const inner = m[1]; // captured value WITHOUT the quotes

        if (!inner) continue;

        // position of the opening quote for the value within the matched slice
        const colonPos = whole.indexOf(":");
        const firstQuotePos = whole.indexOf('"', colonPos); // opening quote of the value
        if (colonPos === -1 || firstQuotePos === -1) continue;

        // Convert to 0-based absolute positions in the line
        const innerStart0 = (m.index ?? 0) + firstQuotePos + 1; // right after the quote
        const innerEnd0 = innerStart0 + inner.length;

        // Monaco columns are 1-based
        decorations.push({
          range: new monaco.Range(ln, innerStart0 + 1, ln, innerEnd0 + 1),
          options: { inlineClassName: "ci-log-component-value" },
        });
      }
    }

    if (!decoRef.current) {
      decoRef.current = editor.createDecorationsCollection(decorations);
    } else {
      decoRef.current.set(decorations);
    }
  }, []);

  // hook decorations into editor lifecycle
  const onMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // re-apply when layout or content changes
    editor.onDidLayoutChange?.(() => applyDecorations());
    editor.onDidChangeModelContent?.(() => applyDecorations());

    applyDecorations();
  };

  const query = React.useMemo(() => {
    const q = new URLSearchParams();
    q.set("format", "text"); // ← important: ask for plain text
    if (tailBytes) q.set("bytes", String(tailBytes));
    if (maxLines) q.set("lines", String(maxLines));
    const s = q.toString();
    return s ? `?${s}` : "";
  }, [tailBytes, maxLines]);

  const load = React.useCallback(async () => {
    setBusy(true);
    setErr(null);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const body = await safeFetchText(`${endpoint}${query}`, {
        signal: ctrl.signal,
      });
      setText(body);
      queueMicrotask(() => applyDecorations());
      setUpdatedAt(Date.now());

      if (autoScroll && editorRef.current) {
        const model = editorRef.current.getModel?.();
        const lastLine = model?.getLineCount?.() ?? 1;
        editorRef.current.revealLineInCenterIfOutsideViewport?.(lastLine);
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to load log.");
    } finally {
      setBusy(false);
    }
  }, [endpoint, query, autoScroll]);

  const clear = React.useCallback(async () => {
    setBusy(true);
    setErr(null);
    abortRef.current?.abort();
    try {
      await fetch(endpoint, { method: "DELETE" });
      setText("");
      queueMicrotask(() => applyDecorations());
      setUpdatedAt(Date.now());
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to clear log.");
    } finally {
      setBusy(false);
    }
  }, [endpoint]);

  // Initial load
  React.useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto polling
  React.useEffect(() => {
    if (!auto) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }
    intervalRef.current = setInterval(() => void load(), Math.max(500, pollMs));
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [auto, pollMs, load]);

  // Cleanup
  React.useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const beforeMount = (monaco: any) => {
    // 1) Define a lightweight custom language
    monaco.languages.register({ id: "ci-log" });

    monaco.languages.setMonarchTokensProvider("ci-log", {
      // Brackets not really used but keeps Monarch happy if encountered
      brackets: [
        { open: "{", close: "}", token: "delimiter.curly" },
        { open: "[", close: "]", token: "delimiter.bracket" },
        { open: "(", close: ")", token: "delimiter.parenthesis" },
        { open: "<", close: ">", token: "delimiter.angle" },
      ],

      tokenizer: {
        root: [
          // ── WAVE separator lines ───────────────────────────────────────────
          [/^#\s*=====.*?WAVE.*?=====/, "wave"],

          // NEW: <ComponentName> (no spaces inside)
          // [/<[^>\n]+>/, 'component'],

          // NEW: functionName()  (identifier followed by empty parens)
          // [/\b[A-Za-z_][\w.$-]*\s*\([^)]*\)/, 'funcname'],

          // ── ISO timestamps ─────────────────────────────────────────────────
          // 2025-11-04T09:25:05.743Z
          [/\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z\b/, "time"],

          // ── Levels ─────────────────────────────────────────────────────────
          [/\bERROR\b/, "level-error"],
          [/\bWARN(?:ING)?\b/, "level-warn"],
          [/\bINFO\b/, "level-info"],
          [/\bDEBUG\b/, "level-debug"],

          // ── JSON-style keys (both quoted and bare) ─────────────────────────
          // "key":  or  key:
          [/"([A-Za-z0-9_\-.$]+)"\s*:/, "key"], // quoted
          [/\b([A-Za-z0-9_\-.$]+)\s*:/, "key"], // bare

          // ── Values: numbers / booleans / null ─────────────────────────────
          [/\b-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?\b/, "number"],
          [/\btrue\b|\bfalse\b/, "boolean"],
          [/\bnull\b/, "null"],

          // ── Strings (very simple, good enough for logs) ────────────────────
          [/"[^"\\]*(?:\\.[^"\\]*)*"/, "string"],

          // Comments (# at start of line or inline)
          [/^#.*$/, "comment"],
          [/\s#.*$/, "comment"],
        ],
        // Scan inside a double-quoted string, allowing inner highlights
        stringDbl: [
          // escaped chars
          [/\\./, "string.escape"],

          // highlight <Component...> inside strings
          [/<[^>"]+>/, "component"],

          // highlight functionName(...) inside strings
          [/\b[A-Za-z_][\w.$-]*\s*\([^)"']*\)/, "funcname"],

          // consume normal string content (no quotes)
          [/[^"\\<]+/, "string"],

          // lone '<' (start of component) — keep it in component color even if split
          [/</, "component"],

          // close string
          [/"/, { token: "string.quote", bracket: "@close", next: "@root" }],
        ],
      },
    });

    // 2) Define CloudIgniter themes (you already switch via useMonacoTheme)
    monaco.editor.defineTheme("cloudigniter-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "wave", foreground: "ffd54f", fontStyle: "bold" },
        { token: "key", foreground: "80cbc4", fontStyle: "bold" },
        // { token: 'component', foreground: 'fb8c00', fontStyle: 'bold' }, // orange
        // { token: 'funcname', foreground: 'fb8c00', fontStyle: 'bold' }, // orange
        { token: "time", foreground: "b0bec5" },
        { token: "level-error", foreground: "ef5350", fontStyle: "bold" },
        { token: "level-warn", foreground: "ffd54f", fontStyle: "bold" },
        { token: "level-info", foreground: "64b5f6" },
        { token: "level-debug", foreground: "9fa8da" },
        { token: "number", foreground: "f78c6c" },
        { token: "boolean", foreground: "ffab91" },
        { token: "null", foreground: "90a4ae", fontStyle: "italic" },
        { token: "string", foreground: "c3e88d" },
        { token: "comment", foreground: "616161", fontStyle: "italic" },
      ],
      colors: {
        "editor.background": "#1e1e1e",
        "editor.lineHighlightBackground": "#33333330",
      },
    });

    monaco.editor.defineTheme("cloudigniter-light", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "wave", foreground: "c49000", fontStyle: "bold" },
        { token: "key", foreground: "2b7a78", fontStyle: "bold" },
        // { token: 'component', foreground: 'fb8c00', fontStyle: 'bold' },
        // { token: 'funcname', foreground: 'fb8c00', fontStyle: 'bold' },
        { token: "time", foreground: "6b7280" },
        { token: "level-error", foreground: "d32f2f", fontStyle: "bold" },
        { token: "level-warn", foreground: "c49000", fontStyle: "bold" },
        { token: "level-info", foreground: "1976d2" },
        { token: "level-debug", foreground: "5c6bc0" },
        { token: "number", foreground: "e65100" },
        { token: "boolean", foreground: "ad1457" },
        { token: "null", foreground: "607d8b", fontStyle: "italic" },
        { token: "string", foreground: "2e7d32" },
        { token: "comment", foreground: "9e9e9e", fontStyle: "italic" },
      ],
      colors: {
        "editor.background": "#ffffff",
        "editor.lineHighlightBackground": "#e2e8f030",
      },
    });
  };

  if (!isMounted) {
    return <div className="text-sm text-gray-400">Loading editor…</div>;
  }

  return (
    <div className="w-full space-y-3 p-3 text-sm">
      {/* Controls */}
      <div className="flex items-center gap-2">
        <ListTree className="size-4" />
        <span className="font-medium">Trace Log (text)</span>

        <div className="ml-auto flex items-center gap-2">
          {updatedAt ? (
            <span className="text-muted-foreground text-xs">
              Updated {new Date(updatedAt).toLocaleTimeString()}
            </span>
          ) : null}

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void load()}
            disabled={busy}
            className="inline-flex items-center gap-1"
            title="Refresh"
          >
            <RefreshCw className={`size-4 ${busy ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <label className="flex cursor-pointer items-center gap-1 text-xs">
            <input
              type="checkbox"
              checked={auto}
              onChange={(e) => setAuto(e.target.checked)}
            />
            Auto
          </label>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void clear()}
            disabled={busy}
            className="inline-flex items-center gap-1 text-red-600"
            title="Clear (truncate file)"
          >
            <Trash2 className="size-4" />
            Clear
          </Button>
        </div>
      </div>

      {/* Error, non-fatal */}
      {err ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {err}
        </div>
      ) : null}

      {/* Monaco editor */}
      <div className="w-full min-w-0 rounded border shadow-sm">
        <Editor
          key={theme}
          height={height}
          width="100%"
          className="w-full"
          wrapperProps={{ className: "w-full" }}
          language="ci-log"
          value={text}
          theme={theme}
          beforeMount={beforeMount}
          // onMount={(editor) => (editorRef.current = editor)}
          onMount={onMount}
          options={{
            automaticLayout: true,
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: "on",
            renderLineHighlight: "all",
            scrollBeyondLastLine: false,
            wordWrap,
            guides: { indentation: false },
            folding: false,
            padding: { top: 8, bottom: 8 },
          }}
        />
      </div>

      <p className="text-muted-foreground">
        Dev-only. Reading text from <code>{endpoint}?format=text</code>
      </p>
    </div>
  );
}

/** Helper to register as a Dev Beacon tab */
// export function getTraceLogTextTab(overrides?: TraceLogViewerTextProps) {
//   return {
//     id: 'trace',
//     label: 'Trace',
//     icon: ListTree,
//     content: <TraceLogViewerText {...overrides} />,
//   };
// }
