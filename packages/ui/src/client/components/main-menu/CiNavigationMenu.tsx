"use client";

import { useEffect, useRef, useState } from "react";
import type { CiNavigationMenuProps } from "@cloudigniter/core/types";

import { CiMenuItem } from "./CiMenuItem";

export function CiNavigationMenu({
  menu,
  trigger,
  pathname,
  navigate,
  onNavigateStart,
  storageKeyPrefix,
}: CiNavigationMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target;

      if (
        target instanceof Node &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  function closeMenu(newRoute?: string) {
    if (!newRoute || newRoute !== pathname) {
      setOpen(false);
    }
  }

  return (
    <div ref={menuRef} className="relative ltr:ml-2">
      <div
        role="button"
        tabIndex={0}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen((current) => !current);
          }

          if (event.key === "Escape") {
            setOpen(false);
          }
        }}
      >
        {trigger}
      </div>

      {open ? (
        <div className="ci-main-menu-box">
          <ul className="ci-main-menu-box-inner" role="menu">
            {menu.map((item) =>
              item.hidden ? null : (
                <CiMenuItem
                  key={item.id}
                  item={item}
                  pathname={pathname}
                  navigate={navigate}
                  onNavigateStart={onNavigateStart}
                  storageKeyPrefix={storageKeyPrefix}
                  closeMenu={closeMenu}
                />
              ),
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
