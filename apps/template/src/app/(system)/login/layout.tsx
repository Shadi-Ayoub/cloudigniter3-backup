import type { Metadata } from "next";
import CiLayout from "@cloudigniter/next/layout/login-standard";
import { appBootstrap } from "@/kernel/server";

export const metadata: Metadata = {
  title: "CloudIgniter Login Page",
  description: "Cloudigniter login page!",
};

interface LayoutInterface {
  children: React.ReactNode;
}
export default async function LoginLayout({ children }: LayoutInterface) {
  const context = await appBootstrap();

  return <CiLayout context={context}>{children}</CiLayout>;
}
