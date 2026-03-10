import { Header } from "@/components/layout/Header";
import { Gallery } from "@/components/gallery/Gallery";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <ErrorBoundary>
        <Header />
      </ErrorBoundary>
      <main className="flex-1 container mx-auto px-4 py-6">
        <ErrorBoundary>
          <Gallery />
        </ErrorBoundary>
      </main>
    </div>
  );
}
