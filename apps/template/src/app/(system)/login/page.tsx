import { appBootstrap } from "@/kernel/server";
import { AppLoginPageClientWrapper } from "@/kernel/client";

export default async function LoginPage() {
  const config = await appBootstrap();

  return <AppLoginPageClientWrapper config={config} />;
}
