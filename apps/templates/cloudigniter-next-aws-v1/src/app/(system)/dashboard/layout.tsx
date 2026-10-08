import type { Metadata } from "next";
import CiLayout from "@cloudigniter/next/layout/cp-standard";
import { appBootstrap } from "@/kernel/server";

export const metadata: Metadata = {
  title: "CloudIgniter Control Panel",
  description: "Cloudigniter platform Control Panel to manage the application!",
};

interface LayoutInterface {
  children: React.ReactNode;
}
export default async function CPLayout({ children }: LayoutInterface) {
  const context = await appBootstrap();

  return <CiLayout context={context}>{children}</CiLayout>;
}
