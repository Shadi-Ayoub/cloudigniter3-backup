import type { Metadata } from "next";
import CiLayout from "@cloudigniter/next/layout/cp-standard";
import { appBootstrap } from "@/kernel/server";

export const metadata: Metadata = {
  title: "CloudIgniter Theme Tokens",
  description: "Cloudigniter built-in default theme style tokens presentation.",
};

interface LayoutInterface {
  children: React.ReactNode;
}
export default async function ThemePresentationLayout({
  children,
}: LayoutInterface) {
  const config = await appBootstrap();

  return <CiLayout config={config}>{children}</CiLayout>;
}
