"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Role = "ADMIN" | "PENELITI";
type NavItem = { href: string; label: string; roles?: Role[] };

export default function Nav({ role = "ADMIN" }: { role?: Role }) {
  const pathname = usePathname();

  const allItems: NavItem[] = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/customers", label: "Customers" },
    { href: "/vehicles", label: "Vehicles" },
    { href: "/services", label: "Services" },
    { href: "/parts", label: "Parts" },
    { href: "/mechanics", label: "Mechanics" },
    { href: "/reminders", label: "Reminders" },
    // hanya untuk PENELITI
    { href: "/analytics/cluster", label: "Clusters", roles: ["PENELITI"] },
  ];

  const items = allItems.filter(i => !i.roles || i.roles.includes(role));
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="rounded-xl border bg-white px-2 py-2 shadow-sm">
      <ul className="flex flex-wrap gap-1">
        {items.map(it => (
          <li key={it.href}>
            <Link
              href={it.href}
              className={[
                "inline-flex items-center rounded-lg px-3 py-2 text-sm transition",
                isActive(it.href) ? "bg-slate-900 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100",
              ].join(" ")}
            >
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
