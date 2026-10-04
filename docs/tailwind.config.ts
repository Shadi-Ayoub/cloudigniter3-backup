import type { Config } from "tailwindcss";
import { LoadContext, Plugin } from "@docusaurus/types";

export default {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./src/**/*.{js,jsx,ts,tsx,mdx}", "./docs/**/*.mdx"],
  theme: {
    extend: {},
  },
  corePlugins: {
    preflight: false,
  },
  blocklist: ["container"],
  plugins: [require("@tailwindcss/typography")],
} satisfies Config;

// export async function tailwindPlugin(
//   context: LoadContext,
//   options: any
// ): Promise<Plugin> {
//   return {
//     name: "docusaurus-tailwindcss",

//     configurePostCss(postcssOptions: { plugins: any[] }) {
//       // Append TailwindCSS and AutoPrefixer
//       postcssOptions.plugins.push(require("tailwindcss"));
//       postcssOptions.plugins.push(require("autoprefixer"));
//       return postcssOptions;
//     },
//   };
// }
