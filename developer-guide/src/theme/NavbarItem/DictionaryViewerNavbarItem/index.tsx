import type { MouseEventHandler } from "react";
import React from "react";
import clsx from "clsx";
import { BookOpen } from "lucide-react";
import { DICTIONARY_VIEWER_OPEN_EVENT } from "../../../components/DictionaryViewer/events";
import styles from "./styles.module.css";

type Props = {
  className?: string;
  mobile?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
};

export default function DictionaryViewerNavbarItem({
  className,
  mobile = false,
  onClick,
}: Props): React.JSX.Element {
  function openDictionaryViewer(event: React.MouseEvent<HTMLButtonElement>) {
    window.dispatchEvent(new Event(DICTIONARY_VIEWER_OPEN_EVENT));
    onClick?.(event);
  }

  if (mobile) {
    return (
      <li className="menu__list-item">
        <button
          aria-controls="dictionary-viewer-dialog"
          aria-haspopup="dialog"
          className={clsx(
            "clean-btn",
            "menu__link",
            styles.mobileButton,
            className,
          )}
          onClick={openDictionaryViewer}
          type="button"
        >
          <BookOpen aria-hidden="true" size={20} strokeWidth={1.8} />
          <span>Open Dictionary Viewer</span>
        </button>
      </li>
    );
  }

  return (
    <button
      aria-controls="dictionary-viewer-dialog"
      aria-haspopup="dialog"
      aria-label="Open Dictionary Viewer"
      className={clsx("clean-btn", styles.desktopButton, className)}
      onClick={openDictionaryViewer}
      title="Open Dictionary Viewer"
      type="button"
    >
      <BookOpen aria-hidden="true" size={20} strokeWidth={1.8} />
    </button>
  );
}
