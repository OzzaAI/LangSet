import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AgencyDashboard from "./agency-dashboard";
import GenericDashboard from "./generic-dashboard";

export default async function Dashboard({ params }: { params: { portalType: string } }) {
  const { portalType } = params;

  const result = await auth.api.getSession({
    headers: await headers(), // you need to pass the headers object.
  });

  if (!result?.session?.userId) {
    redirect("/sign-in");
  }

  // Route to specific dashboard based on portal type
  if (portalType === 'agency') {
    return <AgencyDashboard />;
  }

  // Default generic dashboard for other portal types
  return <GenericDashboard portalType={portalType} />;
}
