const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { performance } = require("node:perf_hooks");
const { test } = require("node:test");
const { runInNewContext } = require("node:vm");

// Execute Next's installed Flight profiler in isolation. This reproduces browser
// User Timing validation without replacing performance.measure in the application.
// Keep this regression while carrying the version-specific pnpm dependency patch.
for (const bundler of ["turbopack", "webpack"]) {
  for (const variant of ["", "-experimental"]) {
    const bundle = `react-server-dom-${bundler}${variant}`;
    const source = readFileSync(
      require.resolve(
        `next/dist/compiled/${bundle}/cjs/react-server-dom-${bundler}-client.browser.development.js`
      ),
      "utf8"
    );
    const start = source.indexOf("    function flushComponentPerformance(");
    const end = source.indexOf(
      "    function flushInitialRenderPerformance(",
      start
    );
    assert.ok(
      start >= 0 && end > start,
      "Review the patch when Next changes its profiler"
    );

    for (const state of ["errored", "aborted"]) {
      test(`${bundle}: ${state} timing cannot replace the original 403 with a Performance error`, () => {
        const measures = [];
        const flush = runInNewContext(
          `${source.slice(start, end)}\nflushComponentPerformance`,
          {
            isArrayImpl: Array.isArray,
            supportsUserTiming: true,
            trackNames: ["Primary"],
            performance: {
              measure(name, options) {
                // Native validation throws for negative/invalid timestamps.
                performance.measure(name, options);
                measures.push({ name, ...options });
              },
              clearMeasures: performance.clearMeasures.bind(performance),
            },
          }
        );
        const denial = Object.assign(
          new Error("NEXT_HTTP_ERROR_FALLBACK;403"),
          {
            digest: "NEXT_HTTP_ERROR_FALLBACK;403",
          }
        );
        for (const time of [-Infinity, -1, 0, 10]) {
          const info = { name: "CiNextAccessDeniedPreview", env: "Server" };
          const root = {
            _children: [],
            _debugInfo:
              state === "errored"
                ? [
                    { time: time >= 0 ? Math.max(0, time - 1) : time - 1 },
                    info,
                    { time },
                  ]
                : [{ time }, info],
            status: state === "errored" ? "rejected" : "pending",
            reason: denial,
          };
          const before = measures.length;
          assert.doesNotThrow(() =>
            flush(
              { _rootEnvironmentName: "Server", _closedReason: null },
              root,
              0,
              -Infinity,
              -Infinity
            )
          );
          assert.equal(root.reason, denial, "Preserve the framework interrupt");
          assert.equal(measures.length - before, time < 0 ? 0 : 1);
          if (time >= 0) {
            const measure = measures.at(-1);
            assert.equal(measure.name, "\u200bCiNextAccessDeniedPreview");
            assert.equal(measure.end, time);
            assert.equal(
              measure.detail.devtools.color,
              state === "errored" ? "error" : "warning"
            );
          }
        }
      });
    }
  }
}
