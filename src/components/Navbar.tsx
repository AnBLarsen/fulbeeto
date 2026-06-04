"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

const navLinks = [
  { href: "/", label: "Fixtures" },
  { href: "/standings", label: "Standings" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-bee-yellow/20 bg-bee-black/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <Image src='/bee.png' alt='Bee' width={48} height={48} className="group-hover:scale-110 transition-transform" loading="lazy" />
          <div>
            <span className="text-xl font-bold text-bee-yellow tracking-tight">
              FulBee<span className="text-white">.TO</span>
            </span>
            <p className="text-[10px] text-gray-500 leading-none">The Bee Sees All ⚽ </p>
          </div>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {navLinks.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  active
                    ? "bg-bee-yellow text-bee-black"
                    : "text-gray-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
