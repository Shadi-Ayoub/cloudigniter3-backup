"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import * as LucideIcons from "lucide-react";
import Link from "next/link";

import type { CiMainMenuItem } from "./types";
import { useCiPageLoaderStore } from "@/ui";

const iconMap = LucideIcons as unknown as Record<string, React.ElementType>;

const resolveIcon = (iconName?: string): React.ElementType => {
  if (!iconName) return LucideIcons.Circle; // Default fallback icon
  return iconMap[iconName] || LucideIcons.Circle; // Resolve icon or fallback
};

export const CiMenuItem = ({
  item,
  closeMenu,
}: {
  item: CiMainMenuItem;
  closeMenu: (newRoute?: string) => void;
}) => {
  const { setLoading } = useCiPageLoaderStore();
  const pathname = usePathname();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const IconComponent = useMemo(() => resolveIcon(item.icon), [item.icon]);

  useEffect(() => {
    const stored = localStorage.getItem(`menu-${item.id}`);
    if (stored) setExpanded(JSON.parse(stored));
  }, [item.id]);

  const toggleSubMenu = () => {
    const newState = !expanded;
    setExpanded(newState);
    localStorage.setItem(`menu-${item.id}`, JSON.stringify(newState));
  };

  const isActive = item.url === pathname;
  const activeClass = isActive ? "ci-main-menu-item-active" : "";

  return (
    <li className="ci-main-menu-item">
      <div className="ci-main-menu-item-inner">
        {item.url ? (
          <Link
            key={item.url}
            href={item.url}
            target={item.target}
            className={`ci-main-menu-item-content ${activeClass}`}
            onClick={(e) => {
              // prevent the default Link behavior so we can push + refresh
              e.preventDefault();

              if (item.url !== pathname) {
                setLoading(true);
                closeMenu(item.url);

                // client‐side navigate…
                router.push(item.url as string);
                // …then force the server to re‐render this segment
                // router.refresh();
              }
            }}
          >
            <IconComponent className="ci-main-menu-item-icon" />
            {item.label}
          </Link>
        ) : (
          <button onClick={toggleSubMenu} className="ci-main-menu-item-content">
            <IconComponent className="ci-main-menu-item-icon" />
            {item.label}
          </button>
        )}
        {item.subMenu && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleSubMenu();
            }}
            className="ci-main-menu-submenu-button"
          >
            <ChevronRight
              className={`ci-main-menu-submenu-button-icon ${
                expanded ? "rotate-90" : ""
              }`}
            />
          </button>
        )}
      </div>

      {expanded && item.subMenu && (
        <ul className="ci-main-menu-submenu-box">
          {Object.values(item.subMenu).map(
            (subItem) =>
              !subItem.hidden && (
                <CiMenuItem
                  key={subItem.id}
                  item={subItem}
                  closeMenu={closeMenu}
                />
              ),
          )}
        </ul>
      )}
    </li>
  );
};
