"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

const navLinks = [
  { href: "/", key: "matches" },
  { href: "/standings", key: "standings" },
  { href: "/bracket", key: "bracket" },
  { href: "/beebot", key: "beebot" },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("nav");
  const [menuOpen, setMenuOpen] = useState(false);

  function switchLocale(next: string) {
    const withoutLocale = pathname.replace(/^\/(en|es)/, "") || "/";
    router.push(`/${next}${withoutLocale}`);
    setMenuOpen(false);
  }

  function isActive(href: string) {
    const full = `/${locale}${href}`;
    return pathname === full || (href === "/" && pathname === `/${locale}`);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-bee-yellow/20 bg-bee-black/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-2 group" onClick={() => setMenuOpen(false)}>
          <Image
            src="/bee.png"
            alt="FulBee.TO"
            width={40}
            height={40}
            className="group-hover:scale-110 transition-transform"
          />
          <span className="text-lg sm:text-xl font-bold text-bee-yellow tracking-tight">
            FulBee<span className="text-white">.TO</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-2">
          <nav className="flex items-center gap-1">
            {navLinks.map(({ href, key }) => (
              <Link
                key={href}
                href={`/${locale}${href}`}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  isActive(href)
                    ? "bg-bee-yellow text-bee-black"
                    : "text-gray-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {t(key)}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1 border border-white/10 rounded-full p-0.5 ml-1">
            {(["en", "es"] as const).map((l) => (
              <button
                key={l}
                onClick={() => switchLocale(l)}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                  locale === l ? "bg-bee-yellow text-bee-black" : "text-gray-500 hover:text-white"
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile: lang switcher + hamburger */}
        <div className="flex sm:hidden items-center gap-2">
          <div className="flex items-center gap-0.5 border border-white/10 rounded-full p-0.5">
            {(["en", "es"] as const).map((l) => (
              <button
                key={l}
                onClick={() => switchLocale(l)}
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                  locale === l ? "bg-bee-yellow text-bee-black" : "text-gray-500"
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Toggle menu"
          >
            <span className={`block w-5 h-0.5 bg-white transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="sm:hidden border-t border-white/10 bg-bee-black/98 px-4 py-3 flex flex-col gap-1">
          {navLinks.map(({ href, key }) => (
            <Link
              key={href}
              href={`/${locale}${href}`}
              onClick={() => setMenuOpen(false)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive(href)
                  ? "bg-bee-yellow text-bee-black"
                  : "text-gray-300 hover:bg-white/10"
              }`}
            >
              {t(key)}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
