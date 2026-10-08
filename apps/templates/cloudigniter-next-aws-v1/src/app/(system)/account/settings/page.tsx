import { AppSettingsPage } from "@/kernel/server/settings/AppSettingsPage";
export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) {
  const { returnTo } = await searchParams;
  return (
    <AppSettingsPage
      scope="user"
      returnTo={typeof returnTo === "string" ? returnTo : undefined}
    />
  );
}
