import { igHeaders } from "@/lib/ig-session";

export async function igWebFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: igHeaders(),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    throw new Error(`Instagram API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}
