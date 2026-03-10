"use client";

import { useState } from "react";

function proxyPic(url: string) {
  return `/api/image?url=${encodeURIComponent(url)}`;
}

export function Avatar({ src, username }: { src: string; username: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="h-6 w-6 rounded-full bg-muted shrink-0 flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
        {username.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={proxyPic(src)}
      alt={username}
      className="h-6 w-6 rounded-full object-cover shrink-0"
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
