import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://andretreib.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://rocketshipper.andretreib.com",
    siteName: "Rocketshipper | Andre Treib",
  },
  applicationName: "Rocketshipper | Andre Treib",
  title: "Rocketshipper | Andre Treib",
  description:
    "A small and fun project to learn about physics and game development.",
  keywords: [
    "Andre Treib",
    "React game",
    "Rocketship game",
    "Next.js",
    "React",
    "Tailwind CSS",
    "TypeScript",
    "JavaScript",
    "HTML",
    "CSS",
    "Web development",
    "Web design",
    "UI/UX",
    "Responsive design",
    "Front-end development",
    "Back-end development",
    "Full-stack development",
    "API development",
    "Database design",
    "Physics",
    "Game development",
    "Physics engine",
    "Game physics",
    "Rocket physics",
    "Space game",
    "Rocketship game",
    "Rocketshipper",
  ],
  authors: [{ name: "Andre Treib", url: "https://andretreib.com" }],
  creator: "Andre Treib",
  publisher: "Andre Treib",
  category: "game",
  robots: {
    index: true,
    follow: true,
  },
  referrer: "origin-when-cross-origin",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(
          inter.className,
          "min-h-screen bg-gray-900 font-sans antialiased"
        )}
      >
        {children}
      </body>
    </html>
  );
}
