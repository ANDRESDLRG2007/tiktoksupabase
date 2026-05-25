"use client";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, usePathname } from "next/navigation";

const ADMINS = ["cristianandres062013@gmail.com", "cristian.rueg@uniagustiniana.edu.co","ivan.sterlingp@uniagustiniana.edu.co"]; // ← pon tus correos admin

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function RootLayout({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const sinNav = pathname === "/login" || pathname === "/register";

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      const u = data.user ?? null;
      setUser(u);
      setIsAdmin(ADMINS.includes(u?.email ?? ""));
    };
    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      setIsAdmin(ADMINS.includes(u?.email ?? ""));
    });

    return () => { listener.subscription.unsubscribe(); };
  }, []);

  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ margin: 0, padding: 0, background: "#000" }}
      >
        <main style={{ paddingBottom: user && !sinNav ? "70px" : "0" }}>
          {children}
        </main>

        {user && !sinNav && (
          <nav style={{
            position: "fixed",
            bottom: 0, left: 0, right: 0,
            background: "rgba(0,0,0,0.97)",
            backdropFilter: "blur(10px)",
            borderTop: "1px solid #1a1a1a",
            display: "flex",
            zIndex: 100,
          }}>
            <NavBtn
              label="Inicio"
              icon="🏠"
              activo={pathname === "/mvp"}
              onClick={() => router.push("/mvp")}
            />
            <NavBtn
              label="Perfil"
              icon="👤"
              activo={pathname === "/user"}
              onClick={() => router.push("/user")}
            />
            {isAdmin && (
              <NavBtn
                label="Admin"
                icon="🛠️"
                activo={pathname === "/admin"}
                onClick={() => router.push("/admin")}
                esAdmin
              />
            )}
          </nav>
        )}
      </body>
    </html>
  );
}

function NavBtn({
  icon, label, activo, onClick, esAdmin,
}: {
  icon: string;
  label: string;
  activo: boolean;
  onClick: () => void;
  esAdmin?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "3px",
        padding: "10px 0",
        background: "none",
        border: "none",
        cursor: "pointer",
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
      }}
    >
      <span style={{ fontSize: "22px" }}>{icon}</span>
      <span style={{
        fontSize: "10px",
        fontWeight: activo ? 700 : 400,
        color: activo
          ? (esAdmin ? "#fe2c55" : "#fff")
          : (esAdmin ? "#fe2c5566" : "#666"),
        letterSpacing: "0.3px",
      }}>
        {label}
      </span>
      {activo && (
        <div style={{
          width: "4px", height: "4px", borderRadius: "50%",
          background: "#fe2c55", marginTop: "1px",
        }} />
      )}
    </button>
  );
}