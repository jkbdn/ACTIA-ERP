import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F5F2]">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header user={session.user} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
        <footer className="shrink-0 border-t border-gray-100 bg-white px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#9AA0A6]">
          <span>
            © {new Date().getFullYear()} <span className="font-medium text-[#5F6368]">Juan Carlos García Corral</span>. Todos los derechos reservados.
          </span>
          <span className="flex items-center gap-3">
            <span>Desarrollado y diseñado por Juan Carlos García Corral para uso exclusivo de ACTIA.</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">Queda prohibida la reproducción, distribución o modificación sin autorización expresa del autor.</span>
          </span>
        </footer>
      </div>
    </div>
  );
}
