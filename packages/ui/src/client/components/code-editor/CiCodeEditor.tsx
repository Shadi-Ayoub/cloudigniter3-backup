"use client";

import { useCallback, useMemo } from "react";
import Editor, {
  type BeforeMount,
  type EditorProps,
  type Monaco,
} from "@monaco-editor/react";

import { useCiMonacoTheme } from "./useCiMonacoTheme";

export interface CiCodeEditorSerializationContext {
  language: string | undefined;
  jsonIndent: number;
}

export type CiCodeEditorContentSerializer = (
  content: unknown,
  context: CiCodeEditorSerializationContext,
) => string;

/**
 * Monaco editor props plus provider-neutral content serialization helpers.
 * Explicit `value` takes precedence over `content`.
 */
export interface CiCodeEditorProps extends EditorProps {
  /** Value to serialize when a Monaco-compatible string value is unavailable. */
  content?: unknown;

  /** Custom serializer for non-string content. */
  contentSerializer?: CiCodeEditorContentSerializer;

  /** JSON indentation used by the default serializer. @default 2 */
  jsonIndent?: number;
}

const defaultLoading = (
  <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
    Loading editor…
  </div>
);

function ciDefineCodeEditorThemes(monaco: Monaco): void {
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
}

function ciSerializeCodeEditorContent(
  content: unknown,
  { language, jsonIndent }: CiCodeEditorSerializationContext,
): string {
  if (typeof content === "string") {
    return content;
  }

  if (language === "json") {
    return JSON.stringify(content, null, jsonIndent) ?? "";
  }

  if (content === null || content === undefined) {
    return "";
  }

  return String(content);
}

/**
 * Shared Monaco editor. Defaults to JSON, application-aware theming, automatic
 * layout, a disabled minimap, visible line numbers, and no trailing scroll.
 */
export function CiCodeEditor({
  content,
  contentSerializer = ciSerializeCodeEditorContent,
  jsonIndent = 2,
  value,
  language,
  defaultLanguage,
  theme,
  beforeMount,
  options,
  width = "100%",
  height = "100%",
  loading = defaultLoading,
  ...editorProps
}: CiCodeEditorProps) {
  const applicationTheme = useCiMonacoTheme();
  const resolvedLanguage = language ?? (defaultLanguage ? undefined : "json");

  const resolvedValue = useMemo(() => {
    if (value !== undefined) {
      return value;
    }

    if (content === undefined) {
      return undefined;
    }

    return contentSerializer(content, {
      language: resolvedLanguage ?? defaultLanguage,
      jsonIndent,
    });
  }, [
    content,
    contentSerializer,
    defaultLanguage,
    jsonIndent,
    resolvedLanguage,
    value,
  ]);

  const handleBeforeMount = useCallback<BeforeMount>(
    (monaco) => {
      ciDefineCodeEditorThemes(monaco);
      beforeMount?.(monaco);
    },
    [beforeMount],
  );

  const resolvedOptions = useMemo<EditorProps["options"]>(
    () => ({
      automaticLayout: true,
      lineNumbers: "on",
      scrollBeyondLastLine: false,
      ...options,
      minimap: {
        enabled: false,
        ...options?.minimap,
      },
    }),
    [options],
  );

  return (
    <Editor
      {...editorProps}
      value={resolvedValue}
      language={resolvedLanguage}
      defaultLanguage={defaultLanguage}
      theme={theme ?? applicationTheme}
      beforeMount={handleBeforeMount}
      options={resolvedOptions}
      width={width}
      height={height}
      loading={loading}
    />
  );
}
