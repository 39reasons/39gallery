import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fimstagram",
  description: "Personal gallery for LE SSERAFIM Instagram photos and Weverse updates",
  openGraph: {
    title: "Fimstagram",
    description: "LE SSERAFIM Photo Gallery",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Fimstagram",
    description: "LE SSERAFIM Photo Gallery",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
