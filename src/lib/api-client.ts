export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const timeout = AbortSignal.timeout(15000);
  const signal = options?.signal
    ? AbortSignal.any([options.signal, timeout])
    : timeout;
  const res = await fetch(url, {
    ...options,
    signal,
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data: unknown = await res.json();
      if (typeof data === "object" && data !== null && "error" in data) {
        const err = (data as Record<string, unknown>).error;
        if (typeof err === "string") message = err;
      }
    } catch {
      // non-JSON error body
    }
    throw new ApiError(res.status, message);
  }
  return res.json() as Promise<T>;
}
