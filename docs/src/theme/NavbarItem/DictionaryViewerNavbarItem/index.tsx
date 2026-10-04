import type { MouseEventHandler } from "react";
import React from "react";
import clsx from "clsx";
import { BookOpen } from "lucide-react";
import NavbarNavLink from "@theme/NavbarItem/NavbarNavLink";
import { DICTIONARY_VIEWER_OPEN_EVENT } from "../../../components/DictionaryViewer/events";
import styles from "./styles.module.css";

type Props = {
  className?: string;
  dictionary?: "user" | "developer";
  label: string;
  to: string;
  mobile?: boolean;
  onClick?: MouseEventHandler<HTMLElement>;
};

export default function DictionaryViewerNavbarItem({
  className,
  dictionary = "user",
  label,
  to,
  mobile = false,
  onClick,
}: Props): React.JSX.Element {
  const viewerLabel =
    dictionary === "developer"
      ? "Open Developer Dictionary Viewer"
      : "Open Dictionary Viewer";
  function openDictionaryViewer(event: React.MouseEvent<HTMLButtonElement>) {
    window.dispatchEvent(
      new CustomEvent(DICTIONARY_VIEWER_OPEN_EVENT, { detail: dictionary })
    );
    onClick?.(event);
  }

  return (
    <li className={clsx(mobile && "menu__list-item", className)}>
      <div className={clsx(styles.row, mobile && styles.mobileRow)}>
        <button
          data-dictionary-audience={dictionary}
          aria-controls="dictionary-viewer-dialog"
          aria-haspopup="dialog"
          aria-label={viewerLabel}
          className={clsx("clean-btn", styles.viewerButton)}
          onClick={openDictionaryViewer}
          type="button"
          title={viewerLabel}
        >
          <BookOpen aria-hidden="true" size={20} strokeWidth={1.8} />
        </button>
        <NavbarNavLink
          label={label}
          to={to}
          activeBasePath={to}
          onClick={onClick}
          className={clsx(
            mobile ? "menu__link" : "dropdown__link",
            `${dictionary}-dictionary-link`,
            styles.pageLink
          )}
          activeClassName={mobile ? "menu__link--active" : "dropdown__link--active"}
        />
      </div>
    </li>
  );
}
