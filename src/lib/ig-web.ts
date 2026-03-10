import { igHeaders } from "@/lib/ig-session";

export async function igWebFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: igHeaders(),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Instagram API error ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}
