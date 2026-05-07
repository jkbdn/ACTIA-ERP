"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const nav = [
  { href: "/dashboard",    label: "Dashboard",    icon: "⬛" },
  { href: "/projects",     label: "Proyectos",    icon: "📁" },
  { href: "/gantt",        label: "Gantt General", icon: "📊" },
  { href: "/calendar",     label: "Calendario",   icon: "📅" },
];

const adminNav = [
  { href: "/admin/users",  label: "Usuarios",     icon: "👥" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "Administrador";

  function NavLink({ href, label, icon }: { href: string; label: string; icon: string }) {
    const active = pathname === href || pathname.startsWith(href + "/");
    return (
      <Link
        href={href}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
          active
            ? "bg-[#F5C400] text-[#1F1F1F] font-semibold"
            : "text-[#9aa0a6] hover:text-white hover:bg-white/5"
        }`}
      >
        <span className="text-base leading-none">{icon}</span>
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <aside className="w-56 bg-[#1F1F1F] flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
        <img src="/logo.svg" alt="ACTIA" className="w-9 h-9 shrink-0 rounded-full" />
        <div>
          <span className="text-white font-bold text-base leading-none block tracking-wide">ACTIA</span>
          <span className="text-[#5F6368] text-[10px] leading-none">ERP Madera</span>
        </div>
      </div>

      {/* Nav principal */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map((item) => <NavLink key={item.href} {...item} />)}

        {/* Sección admin */}
        {isAdmin && (
          <>
            <div className="pt-4 pb-1 px-3">
              <span className="text-[#5F6368] text-[10px] uppercase tracking-widest font-medium">
                Administración
              </span>
            </div>
            {adminNav.map((item) => <NavLink key={item.href} {...item} />)}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/10">
        <p className="text-[#5F6368] text-[10px] uppercase tracking-wider">
          v1.0 · Entramado Ligero
        </p>
      </div>
    </aside>
  );
}
