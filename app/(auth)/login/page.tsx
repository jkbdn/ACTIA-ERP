"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.ok) {
      router.push("/dashboard");
    } else {
      setError("Email o contraseña incorrectos.");
    }
  }

  return (
    <div className="min-h-screen bg-[#1F1F1F] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="flex flex-col items-center gap-3 mb-1">
            <img src="/logo.svg" alt="ACTIA" className="w-20 h-20 rounded-full shadow-lg shadow-[#F5C400]/20" />
            <span className="text-white font-bold text-3xl tracking-widest">ACTIA</span>
          </div>
          <p className="text-[#5F6368] text-sm mt-1">Construcción Industrializada en Madera</p>
        </div>

        {/* Card */}
        <div className="bg-[#2a2a2a] rounded-xl p-8 border border-white/10 shadow-2xl">
          <h1 className="text-white text-xl font-semibold mb-6">Acceder al sistema</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[#5F6368] text-xs font-medium uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1F1F1F] border border-white/10 rounded-lg px-3.5 py-2.5 text-white text-sm placeholder-[#5F6368] focus:outline-none focus:border-[#F5C400] transition-colors"
                placeholder="usuario@actia.tech"
                required
              />
            </div>

            <div>
              <label className="block text-[#5F6368] text-xs font-medium uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1F1F1F] border border-white/10 rounded-lg px-3.5 py-2.5 text-white text-sm placeholder-[#5F6368] focus:outline-none focus:border-[#F5C400] transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-500/30 rounded-lg px-3.5 py-2.5 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F5C400] hover:bg-[#e0b200] disabled:bg-[#F5C400]/50 text-[#1F1F1F] font-semibold rounded-lg py-2.5 text-sm transition-colors mt-2"
            >
              {loading ? "Verificando..." : "Entrar"}
            </button>
          </form>
        </div>

        {/* Demo credentials */}
        <div className="mt-6 bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-[#5F6368] text-xs font-medium uppercase tracking-wider mb-2">
            Accesos demo
          </p>
          <div className="space-y-1 text-xs text-[#9aa0a6]">
            <div className="flex justify-between">
              <span>admin@actia.tech</span>
              <span className="text-[#F5C400]">actia2026</span>
            </div>
            <div className="flex justify-between">
              <span>arquitectura@actia.tech</span>
              <span className="text-[#F5C400]">actia2026</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
