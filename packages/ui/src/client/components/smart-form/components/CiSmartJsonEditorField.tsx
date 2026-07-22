// Final working and validated SmartJsonEditorField with proper isolation of Formik errors
"use client";

import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { useField, useFormikContext } from "formik";
import { AlertCircle, Sparkles, Pencil, X } from "lucide-react";
import { useCiMonacoTheme } from "../hooks/useCiMonacoTheme";
import { Button } from "@ci-ui/client";

interface SmartJsonEditorFieldProps {
  name: string;
  label?: string;
  description?: string;
  schema?: any;
  jsonSchema?: {
    uri: string;
    fileMatch: string[];
    schema: object;
  };
  height?: string;
  readOnly?: boolean;
  direction?: "ltr" | "rtl";
}

export const CiSmartJsonEditorField = ({
  name,
  label,
  description,
  schema,
  jsonSchema,
  height = "300px",
  readOnly = false,
  direction,
}: SmartJsonEditorFieldProps) => {
  const [field, , helpers] = useField(name);
  const { setFieldError } = useFormikContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalJson, setModalJson] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);
  const [dirtySinceOpen, setDirtySinceOpen] = useState(false);
  const editorRef = useRef<any>(null);
  const theme = useCiMonacoTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const beforeMount = (monaco: any) => {
    monaco.editor.defineTheme("cloudigniter-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#1e1e1e",
        "editor.lineHighlightBackground": "#33333330",
      },
    });

    monaco.editor.defineTheme("cloudigniter-light", {
      base: "vs",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#ffffff",
        "editor.lineHighlightBackground": "#e2e8f030",
      },
    });

    if (jsonSchema) {
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        schemas: [jsonSchema],
      });
    }
  };

  const tryFormat = () => {
    try {
      const parsed = JSON.parse(modalJson);
      const formatted = JSON.stringify(parsed, null, 2);
      setModalJson(formatted);
      editorRef.current?.setValue?.(formatted);
      setModalError(null);
    } catch {
      setModalError("Invalid JSON structure");
    }
  };

  const tryApply = () => {
    let parsed;
    try {
      parsed = JSON.parse(modalJson);
    } catch {
      setModalError("Invalid JSON structure");
      return;
    }

    if (schema && typeof schema.safeParse === "function") {
      const result = schema.safeParse(parsed);
      if (!result.success) {
        const issue = result.error?.issues?.[0];
        const errorSummary =
          issue?.message ||
          (issue?.code === "invalid_type"
            ? `Expected ${issue.expected}, received ${issue.received}`
            : "Invalid JSON");
        console.warn("Schema validation failed:", result.error);
        setModalError(errorSummary);
        return;
      }
    }

    setModalError(null);
    // helpers.setValue(modalJson);
    helpers.setValue(parsed);
    setFieldError(name, undefined);
    setModalOpen(false);
    setDirtySinceOpen(false);
  };

  if (!isMounted) {
    return <div className="text-sm text-gray-400">Loading editor...</div>;
  }

  return (
    <div className="mb-6">
      {label && (
        <label dir={direction} className="mb-1 block text-sm font-medium">
          {label}
        </label>
      )}
      {description && (
        <p dir={direction} className="mb-2 text-xs text-gray-500">
          {description}
        </p>
      )}

      {readOnly ? (
        <div className="relative mb-2 rounded border shadow-sm">
          <Editor
            key={theme}
            height={height}
            language="json"
            value={
              typeof field.value === "string"
                ? field.value
                : JSON.stringify(field.value, null, 2)
            }
            theme={theme}
            beforeMount={beforeMount}
            options={{
              minimap: { enabled: false },
              lineNumbers: "off",
              scrollBeyondLastLine: false,
              guides: { indentation: false },
              folding: false,
              readOnly: true,
            }}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="absolute top-2 right-2 flex items-center gap-1"
            onClick={() => {
              setModalJson(
                typeof field.value === "string"
                  ? field.value
                  : JSON.stringify(field.value, null, 2),
              );
              setModalError(null);
              setDirtySinceOpen(false);
              setModalOpen(true);
            }}
          >
            <Pencil size={14} /> Edit
          </Button>
        </div>
      ) : null}

      {modalOpen && (
        <div className="z-modal fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="relative w-full max-w-4xl rounded-md bg-white p-4 shadow-lg dark:bg-gray-900">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Edit JSON</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-500 hover:text-red-600"
              >
                <X />
              </button>
            </div>

            <div className="mb-2 flex justify-end">
              <button
                type="button"
                onClick={tryFormat}
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                <Sparkles className="h-4 w-4" /> Format JSON
              </button>
            </div>

            <div className="mb-4 rounded border shadow-sm">
              <Editor
                key={theme + "_modal"}
                height={height}
                language="json"
                value={modalJson}
                theme={theme}
                beforeMount={beforeMount}
                onMount={(editor) => (editorRef.current = editor)}
                onChange={(v) => {
                  setModalJson(v ?? "");
                  setDirtySinceOpen(true);
                }}
                options={{
                  minimap: { enabled: false },
                  formatOnPaste: true,
                  formatOnType: true,
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  folding: true,
                  lineNumbers: "on",
                  tabSize: 2,
                }}
              />
            </div>

            {modalError && (
              <div className="mb-3 flex items-center gap-2 text-sm text-red-500">
                <AlertCircle className="h-4 w-4" /> {modalError}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                onClick={() => setModalOpen(false)}
                variant="ghost"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={tryApply}
                disabled={modalError !== null || !dirtySinceOpen}
              >
                Apply Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
