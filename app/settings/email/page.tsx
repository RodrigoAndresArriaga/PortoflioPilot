import { redirect } from "next/navigation";

export default function EmailSettingsPage() {
  redirect("/settings#email");
}
