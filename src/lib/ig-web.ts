import { igHeaders } from "@/lib/ig-session";

export async function igWebFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: igHeaders() });
  return res.json() as Promise<T>;
}
