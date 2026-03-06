import { Header } from "@/components/layout/Header";
import { Gallery } from "@/components/gallery/Gallery";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        <Gallery />
      </main>
    </div>
  );
}
