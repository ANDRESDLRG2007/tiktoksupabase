"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) { router.push("/user"); return; }
      setLoading(false);
    };
    checkUser();
  }, [router]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setMessage("❌ " + error.message); setSubmitting(false); return; }
    if (data.user) router.push("/mvp");
  };

  if (loading) return null;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#000",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Helvetica Neue', Arial, sans-serif",
      padding: "0 24px",
    }}>
      {/* Logo */}
      <div style={{ marginBottom: "40px", textAlign: "center" }}>
        <div style={{
          fontSize: "48px",
          fontWeight: 900,
          letterSpacing: "-2px",
          color: "#fff",
          lineHeight: 1,
        }}>
          <span style={{ color: "#fe2c55" }}>Tik</span>
          <span style={{ color: "#fff" }}>Tok</span>
        </div>
        <p style={{ color: "#aaa", fontSize: "14px", marginTop: "8px", letterSpacing: "0.5px" }}>
          Iniciar sesión
        </p>
      </div>

      {/* Card */}
      <div style={{
        width: "100%",
        maxWidth: "380px",
        background: "#1a1a1a",
        borderRadius: "16px",
        padding: "32px 28px",
        border: "1px solid #2a2a2a",
      }}>
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                background: "#2a2a2a",
                border: "1px solid #3a3a3a",
                borderRadius: "8px",
                padding: "14px 16px",
                color: "#fff",
                fontSize: "15px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                background: "#2a2a2a",
                border: "1px solid #3a3a3a",
                borderRadius: "8px",
                padding: "14px 16px",
                color: "#fff",
                fontSize: "15px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%",
              background: submitting ? "#555" : "#fe2c55",
              border: "none",
              borderRadius: "8px",
              padding: "14px",
              color: "#fff",
              fontSize: "16px",
              fontWeight: 700,
              cursor: submitting ? "not-allowed" : "pointer",
              marginTop: "8px",
              letterSpacing: "0.3px",
            }}
          >
            {submitting ? "Iniciando..." : "Iniciar sesión"}
          </button>
        </form>

        {message && (
          <p style={{ color: "#fe2c55", textAlign: "center", marginTop: "16px", fontSize: "14px" }}>
            {message}
          </p>
        )}

        <div style={{ marginTop: "24px", textAlign: "center" }}>
          <p style={{ color: "#888", fontSize: "14px" }}>
            ¿No tienes cuenta?{" "}
            <button
              onClick={() => router.push("/register")}
              style={{
                background: "none",
                border: "none",
                color: "#fe2c55",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                padding: 0,
              }}
            >
              Regístrate
            </button>
          </p>
        </div>
      </div>

      {/* Bottom divider */}
      <div style={{ marginTop: "40px", textAlign: "center" }}>
        <p style={{ color: "#555", fontSize: "12px" }}>
          © 2025 TikTok MVP
        </p>
      </div>
    </div>
  );
}