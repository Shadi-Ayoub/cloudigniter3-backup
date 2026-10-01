import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CiErrorPage } from "../src/client/page/components/CiErrorPage";

test("access errors expose recovery navigation without a misleading retry action", () => {
  const html = renderToStaticMarkup(
    createElement(CiErrorPage, {
      title: "Settings access restricted",
      message: "Ask your administrator for access.",
      severity: "warning",
      showRetry: false,
      actions: createElement("a", { href: "/dashboard" }, "Back to Dashboard"),
    }),
  );
  assert.match(html, /Settings access restricted/);
  assert.match(html, /href="\/dashboard"/);
  assert.match(html, /Back to Dashboard/);
  assert.doesNotMatch(html, /<button|Retry/);
});

test("temporary errors retain both retry and recovery navigation", () => {
  const html = renderToStaticMarkup(
    createElement(CiErrorPage, {
      message: "Please try again.",
      showRetry: true,
      actions: createElement("a", { href: "/dashboard" }, "Back to Dashboard"),
    }),
  );
  assert.match(html, /<button[^>]*type="button"/);
  assert.match(html, /Retry/);
  assert.match(html, /Back to Dashboard/);
});
