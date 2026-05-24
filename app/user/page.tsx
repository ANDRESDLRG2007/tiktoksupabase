"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

interface Video {
  id: string;
  titulo: string;
  url_video: string;
  url_miniatura: string;
  creado_en: string;
}

interface Usuario {
  id: string;
  nombre: string;
  correo: string;
}

export default function UserPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { router.push("/login"); return; }

      const { data: usuarioData } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", data.user.id)
        .maybeSingle();

      if (usuarioData) {
        setUsuario(usuarioData);
        setNuevoNombre(usuarioData.nombre);
        fetchMisVideos(data.user.id);
      } else {
        // El usuario existe en Auth pero no en la tabla, lo creamos
        const emailNombre = data.user.email?.split("@")[0] ?? "usuario";
        const nuevoUsuario = {
          id: data.user.id,
          nombre: emailNombre,
          correo: data.user.email ?? "",
        };
        await supabase.from("usuarios").upsert([nuevoUsuario], { onConflict: "id" });
        setUsuario(nuevoUsuario);
        setNuevoNombre(emailNombre);
        fetchMisVideos(data.user.id);
      }
      setLoading(false);
    };
    checkUser();
  }, [router]);

  const fetchMisVideos = async (uid: string) => {
    const { data } = await supabase
      .from("videos")
      .select("*")
      .eq("usuario_id", uid)
      .order("creado_en", { ascending: false });
    setVideos(data ?? []);
  };

  const borrarVideo = async (videoId: string) => {
    const confirmado = confirm("¿Seguro que quieres borrar este video?");
    if (!confirmado) return;
    const { error } = await supabase.from("videos").delete().eq("id", videoId);
    if (error) { setMensaje("❌ Error al borrar"); return; }
    setMensaje("✅ Video borrado");
    setTimeout(() => setMensaje(null), 2000);
    if (usuario) fetchMisVideos(usuario.id);
  };

  const actualizarNombre = async () => {
    if (!usuario || !nuevoNombre.trim()) return;
    const { error } = await supabase.from("usuarios").update({ nombre: nuevoNombre }).eq("id", usuario.id);
    if (error) { setMensaje("❌ Error al actualizar"); return; }
    // También actualizar en videos
    await supabase.from("videos").update({ nombre_usuario: nuevoNombre }).eq("usuario_id", usuario.id);
    setUsuario({ ...usuario, nombre: nuevoNombre });
    setEditandoNombre(false);
    setMensaje("✅ Nombre actualizado");
    setTimeout(() => setMensaje(null), 2000);
  };

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#fff", fontFamily: "sans-serif" }}>Cargando...</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#000", fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>

      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(0,0,0,0.9)",
        backdropFilter: "blur(10px)",
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid #1a1a1a",
      }}>
        <button onClick={() => router.push("/mvp")} style={{ background: "none", border: "none", color: "#fff", fontSize: "20px", cursor: "pointer" }}>
          ←
        </button>
        <span style={{ color: "#fff", fontWeight: 700, fontSize: "16px" }}>Mi perfil</span>
        <button onClick={cerrarSesion} style={{ background: "none", border: "1px solid #3a3a3a", borderRadius: "8px", color: "#fe2c55", fontSize: "13px", fontWeight: 700, padding: "6px 12px", cursor: "pointer" }}>
          Salir
        </button>
      </div>

      {/* Perfil */}
      <div style={{ padding: "32px 20px 20px", textAlign: "center" }}>
        <div style={{
          width: "80px", height: "80px", borderRadius: "50%",
          background: "#fe2c55",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "32px", fontWeight: 900, color: "#fff",
          margin: "0 auto 14px",
        }}>
          {(usuario?.nombre ?? "U")[0].toUpperCase()}
        </div>

        {editandoNombre ? (
          <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginBottom: "8px" }}>
            <input
              type="text"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              style={{
                background: "#2a2a2a", border: "1px solid #fe2c55",
                borderRadius: "8px", padding: "8px 12px",
                color: "#fff", fontSize: "15px", outline: "none",
              }}
            />
            <button onClick={actualizarNombre} style={{ background: "#fe2c55", border: "none", borderRadius: "8px", padding: "8px 14px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}>
              ✓
            </button>
            <button onClick={() => setEditandoNombre(false)} style={{ background: "#2a2a2a", border: "none", borderRadius: "8px", padding: "8px 14px", color: "#fff", cursor: "pointer", fontSize: "14px" }}>
              ✕
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "6px" }}>
            <p style={{ color: "#fff", fontSize: "20px", fontWeight: 700, margin: 0 }}>
              @{usuario?.nombre}
            </p>
            <button onClick={() => setEditandoNombre(true)} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: "16px" }}>
              ✏️
            </button>
          </div>
        )}

        <p style={{ color: "#555", fontSize: "13px" }}>{usuario?.correo}</p>

        {mensaje && (
          <p style={{ color: mensaje.startsWith("❌") ? "#fe2c55" : "#25f4ee", fontSize: "14px", marginTop: "10px" }}>
            {mensaje}
          </p>
        )}

        {/* Stats */}
        <div style={{ display: "flex", justifyContent: "center", gap: "32px", marginTop: "20px", paddingTop: "20px", borderTop: "1px solid #1a1a1a" }}>
          <div>
            <p style={{ color: "#fff", fontSize: "20px", fontWeight: 700, margin: 0 }}>{videos.length}</p>
            <p style={{ color: "#888", fontSize: "12px", margin: "4px 0 0" }}>Videos</p>
          </div>
        </div>
      </div>

      {/* Mis videos grid */}
      <div style={{ padding: "0 4px" }}>
        <p style={{ color: "#fff", fontWeight: 700, fontSize: "15px", padding: "0 16px 12px" }}>
          Mis videos
        </p>
        {videos.length === 0 ? (
          <p style={{ color: "#555", textAlign: "center", padding: "40px 20px", fontSize: "15px" }}>
            No has subido videos aún.
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2px" }}>
            {videos.map((v) => (
              <div key={v.id} style={{ position: "relative", aspectRatio: "9/16", background: "#111", overflow: "hidden" }}>
                {v.url_miniatura ? (
                  <img src={v.url_miniatura} alt={v.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <video src={v.url_video} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
                )}
                {/* Overlay con título y borrar */}
                <div style={{
                  position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)",
                  display: "flex", flexDirection: "column", justifyContent: "flex-end",
                  padding: "8px",
                  opacity: 0,
                  transition: "opacity 0.2s",
                }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0"; }}
                >
                  <p style={{ color: "#fff", fontSize: "10px", margin: "0 0 6px", fontWeight: 600, lineClamp: 2 } as React.CSSProperties}>{v.titulo}</p>
                  <button
                    onClick={() => borrarVideo(v.id)}
                    style={{
                      background: "#fe2c55", border: "none", borderRadius: "6px",
                      padding: "4px 8px", color: "#fff", fontSize: "11px",
                      fontWeight: 700, cursor: "pointer", width: "100%",
                    }}
                  >
                    🗑️ Borrar
                  </button>
                </div>
                {/* Título siempre visible en mobile */}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.7))", padding: "16px 6px 6px" }}>
                  <p style={{ color: "#fff", fontSize: "10px", margin: 0, fontWeight: 600 }}>{v.titulo}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botón borrar con click en mobile: lista alternativa */}
      <div style={{ padding: "20px 16px" }}>
        <p style={{ color: "#555", fontSize: "12px", textAlign: "center" }}>
          Toca un video y luego borra desde aquí si estás en móvil:
        </p>
        {videos.map((v) => (
          <div key={v.id + "-list"} style={{
            display: "flex", alignItems: "center", gap: "12px",
            padding: "12px 0", borderBottom: "1px solid #1a1a1a",
          }}>
            <div style={{ width: "48px", height: "64px", background: "#1a1a1a", borderRadius: "6px", overflow: "hidden", flexShrink: 0 }}>
              {v.url_miniatura && <img src={v.url_miniatura} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
            </div>
            <p style={{ color: "#ccc", fontSize: "13px", flex: 1, margin: 0 }}>{v.titulo}</p>
            <button
              onClick={() => borrarVideo(v.id)}
              style={{
                background: "none", border: "1px solid #fe2c55",
                borderRadius: "8px", padding: "6px 12px",
                color: "#fe2c55", fontSize: "12px", fontWeight: 700, cursor: "pointer",
              }}
            >
              Borrar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}