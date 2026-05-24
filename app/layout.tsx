"use client";

import "./globals.css";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const [user, setUser] = useState<any>(null);

  useEffect(() => {

    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user ?? null);
    };

    getUser();

    // 🔄 Escuchar login/logout
    const { data: listener } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          setUser(session?.user ?? null);
        }
      );

    return () => {
      listener.subscription.unsubscribe();
    };

  }, []);

  return (
    <html lang="es">
      <body className="bg-gray-100">

        {/* 🔥 NAVBAR */}
        {user && (
          <nav className="bg-black text-white p-4 flex gap-6 justify-center">

            <Link href="/mvp">
              Inicio
            </Link>

            <Link href="/user">
              Mis Videos
            </Link>

            <Link href="/admin">
              Admin
            </Link>

          </nav>
        )}

        {/* 📄 PAGINAS */}
        <main>
          {children}
        </main>

      </body>
    </html>
  );
}