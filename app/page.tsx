"use client";
import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        router.push("/mvp");
      } else {
        router.push("/login");
      }
    };
    checkUser();
  }, [router]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#000",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontSize: "52px",
          fontWeight: 900,
          letterSpacing: "-2px",
          lineHeight: 1,
          marginBottom: "16px",
        }}>
          <span style={{ color: "#fe2c55" }}>Tik</span>
          <span style={{ color: "#fff" }}>Tok</span>
        </div>
        <p style={{ color: "#555", fontSize: "14px", fontFamily: "sans-serif" }}>
          Cargando...
        </p>
      </div>
    </div>
  );
}