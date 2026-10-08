import { appBootstrap } from "@/kernel/server";
import { AppLoginPageClientWrapper } from "@/kernel/client";

export default async function LoginPage() {
  const context = await appBootstrap();

  return <AppLoginPageClientWrapper context={context} />;
}
