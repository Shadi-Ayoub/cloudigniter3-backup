import CiLayout from "@cloudigniter/next/layout/cp-standard";
import { appBootstrap } from "@/kernel/server";
export default async function PersonalSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CiLayout context={await appBootstrap()}>{children}</CiLayout>;
}
