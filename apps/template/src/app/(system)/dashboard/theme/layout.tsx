import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CloudIgniter Theme Tokens",
  description: "Cloudigniter built-in default theme style tokens presentation.",
};

interface LayoutInterface {
  children: React.ReactNode;
}
export default function ThemePresentationLayout({ children }: LayoutInterface) {
  return children;
}
