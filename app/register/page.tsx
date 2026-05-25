"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) { router.push("/mvp"); return; }
      setLoading(false);
    };
    checkUser();
  }, [router]);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    // 1. Registrar en Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre }, // guardamos el nombre en los metadatos
      },
    });

    if (authError) {
      setMessage("❌ " + authError.message);
      setSubmitting(false);
      return;
    }

    // 2. Intentar insert si tenemos el ID (a veces viene, a veces no)
    const userId = authData.user?.id;
    if (userId) {
      await supabase.from("usuarios").upsert([{
        id: userId,
        nombre,
        correo: email,
      }], { onConflict: "id" });
    }
    // Si no vino el ID, el login lo maneja (ver login_page.tsx)

    setMessage("✅ ¡Cuenta creada! Ahora inicia sesión.");
    setSubmitting(false);
    setTimeout(() => router.push("/login"), 1500);
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
      <div style={{ marginBottom: "40px", textAlign: "center" }}>
        <div style={{ fontSize: "48px", fontWeight: 900, letterSpacing: "-2px", color: "#fff", lineHeight: 1 }}>
          <span style={{ color: "#fe2c55" }}>Tik</span>
          <span style={{ color: "#fff" }}>Tok</span>
        </div>
        <p style={{ color: "#aaa", fontSize: "14px", marginTop: "8px" }}>Crear cuenta</p>
      </div>

      <div style={{
        width: "100%", maxWidth: "380px",
        background: "#1a1a1a", borderRadius: "16px",
        padding: "32px 28px", border: "1px solid #2a2a2a",
      }}>
        <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <input
            type="text"
            placeholder="Nombre de usuario"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            style={{
              width: "100%", background: "#2a2a2a", border: "1px solid #3a3a3a",
              borderRadius: "8px", padding: "14px 16px", color: "#fff",
              fontSize: "15px", outline: "none", boxSizing: "border-box",
            }}
          />
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%", background: "#2a2a2a", border: "1px solid #3a3a3a",
              borderRadius: "8px", padding: "14px 16px", color: "#fff",
              fontSize: "15px", outline: "none", boxSizing: "border-box",
            }}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%", background: "#2a2a2a", border: "1px solid #3a3a3a",
              borderRadius: "8px", padding: "14px 16px", color: "#fff",
              fontSize: "15px", outline: "none", boxSizing: "border-box",
            }}
          />
          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%", background: submitting ? "#555" : "#fe2c55",
              border: "none", borderRadius: "8px", padding: "14px",
              color: "#fff", fontSize: "16px", fontWeight: 700,
              cursor: submitting ? "not-allowed" : "pointer", marginTop: "8px",
            }}
          >
            {submitting ? "Creando cuenta..." : "Registrarse"}
          </button>
        </form>

        {message && (
          <p style={{
            color: message.startsWith("❌") ? "#fe2c55" : "#25f4ee",
            textAlign: "center", marginTop: "16px", fontSize: "14px",
          }}>
            {message}
          </p>
        )}

        <div style={{ marginTop: "24px", textAlign: "center" }}>
          <p style={{ color: "#888", fontSize: "14px" }}>
            ¿Ya tienes cuenta?{" "}
            <button
              onClick={() => router.push("/login")}
              style={{ background: "none", border: "none", color: "#fe2c55", fontSize: "14px", fontWeight: 700, cursor: "pointer", padding: 0 }}
            >
              Inicia sesión
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}