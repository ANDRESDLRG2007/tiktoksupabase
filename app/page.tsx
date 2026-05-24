"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const verificarSesion = async () => {
      const { data } = await supabase.auth.getUser();

      // ✅ Si hay usuario → MVP
      if (data.user) {
        router.push("/mvp");
      } else {
        // ❌ Si no hay sesión → Login
        router.push("/login");
      }
    };

    verificarSesion();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-xl font-bold">
        ⏳ Cargando TikTok MVP...
      </p>
    </div>
  );
}