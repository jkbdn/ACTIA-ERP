"use client";
import { signOut } from "next-auth/react";

interface Props {
  user?: { name?: string | null; email?: string | null };
}

export function Header({ user }: Props) {
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      <div className="text-sm text-[#5F6368]">
        Sistema de gestión · Construcción industrializada en madera
      </div>
      <div className="flex items-center gap-4">
        <div className="text-sm text-right">
          <p className="font-medium text-[#1F1F1F] leading-tight">{user?.name}</p>
          <p className="text-[#5F6368] text-xs">{user?.email}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-xs text-[#5F6368] hover:text-[#D72638] px-3 py-1.5 rounded border border-gray-200 hover:border-red-200 transition-colors"
        >
          Salir
        </button>
      </div>
    </header>
  );
}
