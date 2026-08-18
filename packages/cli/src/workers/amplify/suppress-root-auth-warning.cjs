const originalWarn = console.warn.bind(console);

const ignoredWarning = "Be careful when using @auth directives on a field in a root type.";

console.warn = (...args) => {
  const message = args.map((value) => String(value)).join(" ");

  if (message.includes(ignoredWarning)) {
    return;
  }

  originalWarn(...args);
};
