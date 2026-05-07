import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "ACTIA ERP — Construcción Industrializada en Madera",
  description: "Gestión de proyectos de construcción en entramado ligero",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={roboto.variable}>
      <body className="font-sans bg-[#F5F5F2] text-[#1F1F1F] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
