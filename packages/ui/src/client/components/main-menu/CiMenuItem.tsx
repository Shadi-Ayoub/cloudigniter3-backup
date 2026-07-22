"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ElementType,
  type MouseEvent,
} from "react";
import { ChevronRight, Circle } from "lucide-react";
import * as LucideIcons from "lucide-react";

import type { CiMenuItemProps } from "@cloudigniter/core/types";

const iconMap = LucideIcons as unknown as Record<string, ElementType>;

const resolveIcon = (iconName?: string): ElementType => {
  if (!iconName) return Circle;

  return iconMap[iconName] ?? Circle;
};

/**
 * Detect whether a URL should use native browser navigation.
 */
function ciIsExternalHref(href: string): boolean {
  return (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("//") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  );
}

/**
 * Determine whether a click should retain its native browser behavior.
 */
function ciShouldUseNativeNavigation(
  event: MouseEvent<HTMLAnchorElement>,
): boolean {
  return (
    event.defaultPrevented ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    event.button !== 0
  );
}

export function CiMenuItem({
  item,
  pathname,
  closeMenu,
  navigate,
  onNavigateStart,
  storageKeyPrefix = "menu",
}: CiMenuItemProps) {
  const [expanded, setExpanded] = useState(false);

  const IconComponent = useMemo(() => resolveIcon(item.icon), [item.icon]);

  const storageKey = `${storageKeyPrefix}-${item.id}`;

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);

      if (stored !== null) {
        setExpanded(JSON.parse(stored) === true);
      }
    } catch {
      // Ignore unavailable or invalid browser storage.
    }
  }, [storageKey]);

  const toggleSubMenu = () => {
    setExpanded((current) => {
      const next = !current;

      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // Ignore unavailable browser storage.
      }

      return next;
    });
  };

  const href = item.url;
  const isActive = !!href && href === pathname;
  const activeClass = isActive ? "ci-main-menu-item-active" : "";
  const isExternal = href ? ciIsExternalHref(href) : false;

  async function ciHandleNavigate(event: MouseEvent<HTMLAnchorElement>) {
    if (!href || isExternal || ciShouldUseNativeNavigation(event)) {
      return;
    }

    /**
     * Allow normal anchor navigation when no client-side navigation
     * implementation has been provided.
     */
    if (!navigate) {
      closeMenu(href);
      return;
    }

    event.preventDefault();

    if (href === pathname) {
      closeMenu();
      return;
    }

    onNavigateStart?.(href);
    closeMenu(href);

    await navigate(href);
  }

  return (
    <li className="ci-main-menu-item">
      <div className="ci-main-menu-item-inner">
        {href ? (
          <a
            href={href}
            target={item.target}
            rel={item.target === "_blank" ? "noopener noreferrer" : undefined}
            className={`ci-main-menu-item-content ${activeClass}`}
            aria-current={isActive ? "page" : undefined}
            onClick={ciHandleNavigate}
          >
            <IconComponent
              className="ci-main-menu-item-icon"
              aria-hidden="true"
            />

            {item.label}
          </a>
        ) : (
          <button
            type="button"
            onClick={toggleSubMenu}
            className="ci-main-menu-item-content"
            aria-expanded={item.subMenu ? expanded : undefined}
          >
            <IconComponent
              className="ci-main-menu-item-icon"
              aria-hidden="true"
            />

            {item.label}
          </button>
        )}

        {item.subMenu ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              toggleSubMenu();
            }}
            className="ci-main-menu-submenu-button"
            aria-label={
              expanded
                ? `Collapse ${item.label} submenu`
                : `Expand ${item.label} submenu`
            }
            aria-expanded={expanded}
          >
            <ChevronRight
              className={`ci-main-menu-submenu-button-icon ${
                expanded ? "rotate-90" : ""
              }`}
              aria-hidden="true"
            />
          </button>
        ) : null}
      </div>

      {expanded && item.subMenu ? (
        <ul className="ci-main-menu-submenu-box">
          {Object.values(item.subMenu).map((subItem) =>
            subItem.hidden ? null : (
              <CiMenuItem
                key={subItem.id}
                item={subItem}
                pathname={pathname}
                closeMenu={closeMenu}
                navigate={navigate}
                onNavigateStart={onNavigateStart}
                storageKeyPrefix={storageKeyPrefix}
              />
            ),
          )}
        </ul>
      ) : null}
    </li>
  );
}
