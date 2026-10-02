let pending;
let loaded;
export function setEditorTheme(theme) {
  loaded?.setTheme(theme);
}
export async function loadEditor() {
  if (!pending) {
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = "/editor/editor.css";
    const stylesReady = new Promise((resolve, reject) => {
      stylesheet.onload = resolve;
      stylesheet.onerror = () =>
        reject(
          new Error(
            "Unable to load editor styles. Select the file again to retry.",
          ),
        );
    });
    document.head.append(stylesheet);
    pending = Promise.all([import("/editor/editor.js"), stylesReady])
      .then(([editor]) => {
        loaded = editor;
        return editor;
      })
      .catch((error) => {
        stylesheet.remove();
        pending = undefined;
        throw error;
      });
  }
  const editor = await pending;
  editor.setTheme(document.documentElement.dataset.theme);
  return editor;
}
