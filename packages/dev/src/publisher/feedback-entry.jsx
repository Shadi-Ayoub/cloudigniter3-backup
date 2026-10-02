import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { CiAlertDialog } from "@cloudigniter/ui/client";

/** Reuse the system alert inside the browser's modal layer above the editor. */
export function confirmDiscard({ file }) {
  return new Promise((resolve, reject) => {
    const previousFocus = document.activeElement;
    const layer = document.createElement("dialog");
    layer.className = "publisher-alert-layer";
    layer.setAttribute("aria-label", "Configuration confirmation");
    const host = document.createElement("div");
    layer.append(host);
    document.body.append(layer);
    const root = createRoot(host, {
      onUncaughtError: (error) => finish(false, error),
    });
    let settled = false;
    let confirmed = false;
    const finish = (accepted, error) => {
      if (settled) return;
      settled = true;
      queueMicrotask(() => {
        root.unmount();
        layer.close();
        layer.remove();
        if (previousFocus?.isConnected)
          previousFocus.focus({ preventScroll: true });
        if (error) reject(error);
        else resolve(accepted);
      });
    };
    layer.addEventListener("cancel", (event) => {
      event.preventDefault();
      finish(false);
    });
    layer.addEventListener("close", () => finish(false));
    try {
      layer.showModal();
      root.render(
        createElement(CiAlertDialog, {
          open: true,
          portalContainer: layer,
          variant: "destructive",
          title: "Discard unsaved configuration changes?",
          description: createElement(
            "span",
            null,
            "Your unsaved changes to ",
            createElement("code", { className: "publisher-alert-file" }, file),
            " will be discarded. The file on disk will remain unchanged.",
          ),
          cancelLabel: "Keep editing",
          confirmLabel: "Discard changes",
          onConfirm: () => {
            confirmed = true;
          },
          onOpenChange: (open) => {
            if (!open) finish(confirmed);
          },
        }),
      );
    } catch (error) {
      finish(false, error);
    }
  });
}
