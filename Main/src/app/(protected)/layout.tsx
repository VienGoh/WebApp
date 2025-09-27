// src/app/(protected)/layout.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Nav from "@/components/forms/Nav";

type Role = "ADMIN" | "PENELITI";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const role: Role = (session?.user.role as Role) ?? "ADMIN"; // default ADMIN => Cluster disembunyikan

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between py-3 px-4">
          <div className="font-semibold tracking-tight">Sistem Bengkel</div>
          {session?.user && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">
                {session.user.email} · <b>{session.user.role}</b>
              </span>
              <form action="/api/auth/signout" method="post">
                <input type="hidden" name="callbackUrl" value="/public/login" />
                <button className="rounded-lg border px-3 py-1 text-sm">Logout</button>
              </form>
            </div>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-3">
        {/* pass role ke Nav */}
        <Nav role={role} />
      </div>

      <main className="container mx-auto px-4 pb-12 flex-1">{children}</main>

      <footer className="border-t bg-white">
        <div className="container mx-auto px-4 py-4 text-xs text-slate-500">
          © {new Date().getFullYear()} Sistem Bengkel
        </div>
      </footer>
    </div>
  );
}
