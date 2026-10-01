import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { DropdownMenu, DropdownMenuSub, DropdownMenuSubTrigger } from "../src/client/components/shadcn/dropdown-menu";
import { CiNavigateWithLoader } from "../src/client/navigation/ci-navigate-with-loader";

test("navigation links preserve the menu's accessibility and focus attributes", () => {
  const html = renderToStaticMarkup(createElement(CiNavigateWithLoader, {
    href: "/dashboard/security", role: "menuitem", tabIndex: -1,
    "aria-haspopup": "menu", "aria-expanded": true, id: "security-trigger",
  }, "Security"));
  assert.match(html, /role="menuitem"/);
  assert.match(html, /tabindex="-1"/);
  assert.match(html, /aria-haspopup="menu"/);
  assert.match(html, /aria-expanded="true"/);
  assert.match(html, /id="security-trigger"/);
});

test("a submenu trigger composes a single navigable anchor without invalid nested controls", () => {
  const html = renderToStaticMarkup(createElement(DropdownMenu, { open: true },
    createElement(DropdownMenuPrimitive.Content, { forceMount: true },
      createElement(DropdownMenuSub, null,
        createElement(DropdownMenuSubTrigger, { asChild: true },
          createElement(CiNavigateWithLoader, { href: "/dashboard/security" }, "Security"),
        ),
      ),
    ),
  ));
  assert.match(html, /<a[^>]*aria-haspopup="menu"[^>]*href="\/dashboard\/security"/);
  assert.equal((html.match(/<a\b/g) ?? []).length, 1);
  assert.doesNotMatch(html, /<button/);
});
