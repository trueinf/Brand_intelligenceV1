import { redirect } from "next/navigation";

/**
 * Dashboard route redirects to single-page app (brand search + campaign assets).
 */
export default function DashboardPage() {
  redirect("/");
}
