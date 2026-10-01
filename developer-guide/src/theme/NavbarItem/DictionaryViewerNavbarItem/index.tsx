import type { MouseEventHandler } from "react";
import React from "react";
import clsx from "clsx";
import { BookOpen } from "lucide-react";
import { DICTIONARY_VIEWER_OPEN_EVENT } from "../../../components/DictionaryViewer/events";
import styles from "./styles.module.css";

type Props = {
  className?: string;
  dictionary?: "user" | "developer";
  mobile?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
};

export default function DictionaryViewerNavbarItem({
  className,
  dictionary = "user",
  mobile = false,
  onClick,
}: Props): React.JSX.Element {
  const label =
    dictionary === "developer"
      ? "Open Developer Dictionary Viewer"
      : "Open Dictionary Viewer";
  function openDictionaryViewer(event: React.MouseEvent<HTMLButtonElement>) {
    window.dispatchEvent(
      new CustomEvent(DICTIONARY_VIEWER_OPEN_EVENT, { detail: dictionary })
    );
    onClick?.(event);
  }

  if (mobile) {
    return (
      <li className="menu__list-item">
        <button
          data-dictionary-audience={dictionary}
          aria-controls="dictionary-viewer-dialog"
          aria-haspopup="dialog"
          className={clsx(
            "clean-btn",
            "menu__link",
            styles.mobileButton,
            className
          )}
          onClick={openDictionaryViewer}
          type="button"
        >
          <BookOpen aria-hidden="true" size={20} strokeWidth={1.8} />
          <span>{label}</span>
        </button>
      </li>
    );
  }

  return (
    <button
      data-dictionary-audience={dictionary}
      aria-controls="dictionary-viewer-dialog"
      aria-haspopup="dialog"
      aria-label={label}
      className={clsx("clean-btn", styles.desktopButton, className)}
      onClick={openDictionaryViewer}
      title={label}
      type="button"
    >
      <BookOpen aria-hidden="true" size={20} strokeWidth={1.8} />
    </button>
  );
}
