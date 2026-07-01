import { SettingsPageContent } from "@/components/settings/settings-page-content";
import { getSettingsPageData } from "@/lib/server/settings";

export default async function SettingsPage() {
  const data = await getSettingsPageData();

  return <SettingsPageContent {...data} />;
}
