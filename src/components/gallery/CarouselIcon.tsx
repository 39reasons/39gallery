export function CarouselIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? "h-5 w-5 text-white drop-shadow-md"} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z" />
    </svg>
  );
}
