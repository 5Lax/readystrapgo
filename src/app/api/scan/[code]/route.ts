import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/scan/[code]
 *
 * QR code scan endpoint. When someone scans a sample QR code:
 * 1. Looks up the sample by scan_code
 * 2. Logs the scan (timestamp, IP, geolocation, device)
 * 3. Redirects to the landing page
 *
 * This is the "smart" part -- every scan is tracked before redirect.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  if (!code) {
    return NextResponse.json({ error: "Missing scan code" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Look up the sample
  const { data: sample, error: sampleError } = await supabase
    .from("scan_samples")
    .select("id, scan_code, title")
    .eq("scan_code", code)
    .single();

  if (sampleError || !sample) {
    // Redirect to a "sample unknown" page instead of showing raw error
    const origin = new URL(request.url).origin;
    return NextResponse.redirect(`${origin}/scan/unknown`);
  }

  // Extract scan metadata from the request
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  const deviceType = detectDeviceType(userAgent);

  // IP geolocation (non-blocking best effort)
  const geo = await getGeoFromIP(ip);

  // Log the scan
  await supabase.from("scan_logs").insert({
    sample_id: sample.id,
    scan_code: code,
    ip_address: ip,
    city: geo?.city || null,
    region: geo?.region || null,
    country: geo?.country || null,
    latitude: geo?.lat || null,
    longitude: geo?.lon || null,
    user_agent: userAgent,
    device_type: deviceType,
    is_internal: false, // landing page will update if user authenticates
  });

  // Redirect to the landing page
  const origin = new URL(request.url).origin;
  return NextResponse.redirect(`${origin}/scan/${code}`);
}

/**
 * Detect device type from user agent string.
 */
function detectDeviceType(ua: string): string {
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Android/i.test(ua)) return "Android";
  if (/Windows Phone/i.test(ua)) return "Windows Phone";
  if (/Macintosh|Mac OS/i.test(ua)) return "Mac";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Linux/i.test(ua)) return "Linux";
  return "Unknown";
}

/**
 * Free IP geolocation using ip-api.com (no API key needed, 45 req/min).
 * Returns null on failure -- scan logging should never block on this.
 */
async function getGeoFromIP(
  ip: string
): Promise<{ city: string; region: string; country: string; lat: number; lon: number } | null> {
  if (ip === "unknown" || ip === "127.0.0.1" || ip === "::1") return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`http://ip-api.com/json/${ip}?fields=city,regionName,country,lat,lon`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();
    return {
      city: data.city,
      region: data.regionName,
      country: data.country,
      lat: data.lat,
      lon: data.lon,
    };
  } catch {
    return null; // Never fail the scan because geo lookup timed out
  }
}