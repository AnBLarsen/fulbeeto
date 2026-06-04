import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { ChatPanel } from "@/components/ChatPanel";

export const metadata: Metadata = {
  title: "FulBee.TO | World Cup Fixtures",
  description: "Live World Cup fixtures, standings, and AI-powered match analysis. The Bee Sees All. ⚽ ",
  icons: {
    icon: "/ball.png",
  },
  openGraph: {
    title: "FulBee.TO | World Cup Fixtures",
    description: "Live World Cup fixtures, standings, and AI-powered match analysis. The Bee Sees All. ⚽ ",
    images: [
      {
        url: "/bee.png",
        width: 1200,
        height: 630,
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bee-black antialiased">
        <Navbar />
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        <ChatPanel />
      </body>
    </html>
  );
}
