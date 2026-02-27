import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import ScanLandingClient from "./scan-landing-client";

/**
 * /scan/[code] - Landing page after QR scan
 *
 * Server component fetches sample data, then renders the client component
 * which handles the interactive UI (feedback form, GPS, etc.)
 */
export default async function ScanLandingPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = createAdminClient();

  const { data: sample } = await supabase
    .from("scan_samples")
    .select("*")
    .eq("scan_code", code)
    .single();

  if (!sample) {
    notFound();
  }

  // Get scan count for this sample
  const { count } = await supabase
    .from("scan_logs")
    .select("*", { count: "exact", head: true })
    .eq("sample_id", sample.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <ScanLandingClient sample={sample} scanCount={count || 0} />
    </div>
  );
}