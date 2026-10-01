import type { PropsWithChildren } from "react";
import React from "react";
import DictionaryViewer from "../components/DictionaryViewer";
import MediaViewer from "../components/MediaViewer";
import GuideSearchModal from "../components/GuideSearchModal";

export default function Root({
  children,
}: PropsWithChildren): React.JSX.Element {
  return (
    <>
      {children}
      <DictionaryViewer />
      <MediaViewer />
      <GuideSearchModal />
    </>
  );
}
