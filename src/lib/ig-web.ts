import { igHeaders } from "@/lib/ig-session";

export async function igWebFetch(url: string): Promise<Record<string, unknown>> {
  const res = await fetch(url, { headers: igHeaders() });
  return res.json();
}
