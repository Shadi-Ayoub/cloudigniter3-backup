import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { GUIDE_SEARCH_OPEN_EVENT } from "../../components/GuideSearchModal/events";
import styles from "./styles.module.css";

export default function SearchBar(): React.JSX.Element {
  const [modifier, setModifier] = useState("Ctrl");
  useEffect(() => {
    setModifier(/Mac|iPhone|iPad|iPod/.test(navigator.platform) ? "⌘" : "Ctrl");
  }, []);
  return (
    <button
      className={styles.search}
      type="button"
      aria-label="Search guides"
      aria-haspopup="dialog"
      aria-controls="guide-search-dialog"
      aria-keyshortcuts="Meta+K Control+K"
      onClick={() => window.dispatchEvent(new Event(GUIDE_SEARCH_OPEN_EVENT))}
    >
      <Search size={15} aria-hidden="true" />
      <span>Search</span>
      <kbd aria-hidden="true">{modifier} K</kbd>
    </button>
  );
}
