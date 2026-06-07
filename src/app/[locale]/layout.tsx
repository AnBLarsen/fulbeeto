import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import "../globals.css";
import { Navbar } from "@/components/Navbar";
import { ChatPanel } from "@/components/ChatPanel";

export const metadata: Metadata = {
  title: "FulBee.TO | AI powered World Cup companion",
  description: "Live World Cup fixtures, standings, and AI-powered match analysis ⚽",
  icons: { icon: "/ball.png" },
  openGraph: {
    title: "FulBee.TO | AI powered World Cup companion",
    description: "Live World Cup fixtures, standings and AI-powered match analysis ⚽",
    images: [{ url: "/ball.png", width: 1200, height: 630, alt: "Soccer ball" }],
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "en" | "es")) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="min-h-screen bg-bee-black antialiased">
        <NextIntlClientProvider messages={messages}>
          <Navbar />
          <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
          <ChatPanel />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
