/** ---------- constants ---------- */
export const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
export const SCALE_PREFIXES = ['primary', 'secondary', 'accent', 'muted'] as const;

export const BASE_LIGHT_KEYS = [
  '--color-background',
  '--color-foreground',
  '--color-primary',
  '--color-secondary',
  '--color-accent',
  '--color-muted',
] as const;

export const BASE_LIGHT_LABELS: Record<string, string> = {
  '--color-background': 'Background',
  '--color-foreground': 'Foreground',
  '--color-primary': 'Primary',
  '--color-secondary': 'Secondary',
  '--color-accent': 'Accent',
  '--color-muted': 'Muted',
};

export const BASE_DARK_KEYS = [
  '--color-dark-background',
  '--color-dark-foreground',
  '--color-dark-primary',
  '--color-dark-secondary',
  '--color-dark-accent',
  '--color-dark-muted',
] as const;

export const STATES = ['success', 'info', 'warning', 'danger'] as const;
