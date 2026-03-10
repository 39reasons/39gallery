import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
      <h2 className="text-lg font-semibold mb-2">Page not found</h2>
      <p className="text-sm text-muted-foreground mb-4">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="text-sm text-muted-foreground hover:text-foreground underline"
      >
        Go home
      </Link>
    </div>
  );
}
