import { createBrowserClient } from "@supabase/ssr";

let cachedClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Validate URL format before attempting to create client
  if (!supabaseUrl || !supabaseKey || !supabaseUrl.startsWith("http")) {
    // Return a mock client that will fail gracefully when used
    console.warn(
      "Supabase environment variables not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
    // Create a dummy client with a placeholder URL to prevent crashes during rendering
    // Actual operations will fail but the app won't crash on load
    cachedClient = createBrowserClient(
      "https://placeholder.supabase.co",
      "placeholder-key"
    );
    return cachedClient;
  }

  cachedClient = createBrowserClient(supabaseUrl, supabaseKey);
  return cachedClient;
}
