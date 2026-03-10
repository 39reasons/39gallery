const IG_APP_ID = "936619743392459";
const WEB_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export async function igWebFetch(url: string): Promise<Record<string, unknown>> {
  const sessionId = process.env.IG_SESSION_ID;
  const csrfToken = process.env.IG_CSRF_TOKEN;
  if (!sessionId || !csrfToken) {
    throw new Error("No session configured");
  }

  const dsUserId = sessionId.split("%3A")[0];

  const res = await fetch(url, {
    headers: {
      "User-Agent": WEB_UA,
      "X-CSRFToken": csrfToken,
      "X-IG-App-ID": IG_APP_ID,
      "X-IG-WWW-Claim": "0",
      "X-Instagram-AJAX": "1",
      "X-Requested-With": "XMLHttpRequest",
      "Sec-Fetch-Site": "same-origin",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Dest": "empty",
      Accept: "*/*",
      Referer: "https://www.instagram.com/",
      Cookie: `sessionid=${sessionId}; csrftoken=${csrfToken}; ds_user_id=${dsUserId}`,
    },
  });

  return res.json();
}
