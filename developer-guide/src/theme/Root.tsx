import type { PropsWithChildren } from "react";
import React from "react";
import DictionaryViewer from "../components/DictionaryViewer";

export default function Root({
  children,
}: PropsWithChildren): React.JSX.Element {
  return (
    <>
      {children}
      <DictionaryViewer />
    </>
  );
}
