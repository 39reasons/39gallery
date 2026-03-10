function proxyPic(url: string) {
  return `/api/image?url=${encodeURIComponent(url)}`;
}

export function Avatar({ src, username }: { src: string; username: string }) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={proxyPic(src)}
      alt={username}
      className="h-6 w-6 rounded-full object-cover shrink-0"
      referrerPolicy="no-referrer"
    />
  );
}
