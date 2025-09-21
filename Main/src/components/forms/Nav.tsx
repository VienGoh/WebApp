"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Beranda" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/customers", label: "Customers" },
  { href: "/vehicles", label: "Vehicles" },
  { href: "/parts", label: "Parts" },
  { href: "/mechanics", label: "Mechanics" },
  { href: "/services/new", label: "Input Service" },
{ href: "/analytics/cluster", label: "Clustering" },
{ href: "/reminders", label: "Reminders" },

];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="nav flex flex-wrap gap-2 pb-3">
      {links.map((l) => {
        // aktif untuk path yang sama persis atau diawali (mis. /services vs /services/new)
        const active =
          pathname === l.href ||
          (l.href !== "/" && pathname.startsWith(l.href));

        return (
          <Link
            key={l.href}
            href={l.href}
            className={[
              "rounded-xl border px-3 py-2 text-sm transition",
              active
                ? "bg-blue-50 border-blue-300 text-blue-700"
                : "bg-white border-slate-200 text-slate-800 hover:bg-blue-50 hover:border-blue-300",
            ].join(" ")}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
