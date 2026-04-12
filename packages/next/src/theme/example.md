## Example usage in app router

### app/providers.tsx

```ts
"use client";

import type { ReactNode } from "react";
import { CiThemeProvider } from "@cloudigniter/next";

type AppTheme = "light" | "dark";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CiThemeProvider<AppTheme>
      config={{
        theme: {
          defaultTheme: "light",
          useSystemPreference: true,
          enableColorScheme: true,
          disableTransitionOnChange: true,
          supportedThemes: ["light", "dark"],
          attributeStrategy: "class",
          storageKey: "ci-theme",
        },
      }}
    >
      {children}
    </CiThemeProvider>
  );
}
```

### app/layout.tsx

```ts
import type { ReactNode } from "react";
import { Providers } from "./providers";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

:::tip
`suppressHydrationWarning` on `<html>` is commonly appropriate with `next-themes`.
:::

## Example with raw override

If a consumer needs direct `next-themes` control, they can still override.

```ts
<CiThemeProvider
  config={{
    theme: {
      defaultTheme: "dark",
      supportedThemes: ["light", "dark"],
      attributeStrategy: "class",
    },
    themeProviderProps: {
      forcedTheme: "dark",
    },
  }}
>
  {children}
</CiThemeProvider>
```

Because of the merge order, `forcedTheme: "dark"` wins.
