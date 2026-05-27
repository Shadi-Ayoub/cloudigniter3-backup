"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import type { CiMainMenuItem } from "@cloudigniter/core/client";
import { CiMenuItem } from "./CiMenuItem";

interface CiNavigationMenuProps {
  menu: CiMainMenuItem[];
  trigger: React.ReactNode;
}

export const CiNavigationMenu = ({ menu, trigger }: CiNavigationMenuProps) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={menuRef} className="relative ltr:ml-2">
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div className="ci-main-menu-box">
          <ul className="ci-main-menu-box-inner">
            {menu.map((item) =>
              !item.hidden ? (
                <CiMenuItem
                  key={item.id}
                  item={item}
                  closeMenu={(newRoute) => {
                    if (newRoute && newRoute !== pathname) setOpen(false);
                  }}
                />
              ) : null,
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
