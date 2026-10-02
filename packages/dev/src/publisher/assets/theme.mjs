export const themeModes = ["system", "light", "dark"];
export const nextTheme = (mode) =>
  themeModes[(themeModes.indexOf(mode) + 1) % themeModes.length];
export const resolvedTheme = (mode, systemDark) =>
  mode === "system" ? (systemDark ? "dark" : "light") : mode;
