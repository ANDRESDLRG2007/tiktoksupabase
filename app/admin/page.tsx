"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

const ADMIN_EMAIL = "cristianandres062013@gmail.com"; // ← CAMBIA ESTO

interface Video {
  id: string;
  titulo: string;
  url_video: string;
  url_miniatura: string;
  usuario_id: string;
  nombre_usuario: string;
  creado_en: string;
}

interface Comentario {
  id: string;
  contenido: string;
  video_id: string;
  usuario_id: string;
  nombre_usuario: string | null;
  creado_en: string;
}

interface Like {
  id: string;
  video_id: string;
  usuario_id: string;
}

type Vista = "videos" | "detalle";

export default function AdminPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [comentarios, setComentarios] = useState<Record<string, Comentario[]>>({});
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [videoSeleccionado, setVideoSeleccionado] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [vista, setVista] = useState<Vista>("videos");
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    const verificar = async () => {
      const { data } = await supabase.auth.getUser();
      const ADMINS = ["cristian.rueg@uniagustiniana.edu.co", "cristianandres062013@gmail.com"];
      if (!data.user || !ADMINS.includes(data.user.email ?? "")) {
        router.push("/login");
        return;
      }
      fetchTodo();
    };
    verificar();
  }, [router]);

  const fetchTodo = async () => {
    setLoading(true);
    const { data: v } = await supabase
      .from("videos")
      .select("*")
      .order("creado_en", { ascending: false });
    const videosData = v ?? [];
    setVideos(videosData);

    // Cargar likes y comentarios de cada video
    const comentariosMap: Record<string, Comentario[]> = {};
    const likesMap: Record<string, number> = {};

    await Promise.all(
      videosData.map(async (video) => {
        const { data: c } = await supabase
          .from("comentarios")
          .select("*")
          .eq("video_id", video.id)
          .order("creado_en", { ascending: true });
        comentariosMap[video.id] = c ?? [];

        const { count } = await supabase
          .from("likes")
          .select("*", { count: "exact", head: true })
          .eq("video_id", video.id);
        likesMap[video.id] = count ?? 0;
      })
    );

    setComentarios(comentariosMap);
    setLikes(likesMap);
    setLoading(false);
  };

  const borrarVideo = async (id: string) => {
    const conf = confirm("¿Borrar este video y todos sus likes y comentarios?");
    if (!conf) return;
    await supabase.from("likes").delete().eq("video_id", id);
    await supabase.from("comentarios").delete().eq("video_id", id);
    const { error } = await supabase.from("videos").delete().eq("id", id);
    if (error) { mostrarMensaje("❌ Error: " + error.message); return; }
    mostrarMensaje("✅ Video borrado");
    setVista("videos");
    setVideoSeleccionado(null);
    fetchTodo();
  };

  const borrarComentario = async (comentarioId: string, videoId: string) => {
    const { error } = await supabase.from("comentarios").delete().eq("id", comentarioId);
    if (error) { mostrarMensaje("❌ Error: " + error.message); return; }
    mostrarMensaje("✅ Comentario borrado");
    // Actualizar lista de comentarios localmente
    setComentarios((prev) => ({
      ...prev,
      [videoId]: prev[videoId].filter((c) => c.id !== comentarioId),
    }));
  };

  const mostrarMensaje = (msg: string) => {
    setMensaje(msg);
    setTimeout(() => setMensaje(null), 3000);
  };

  const abrirDetalle = (video: Video) => {
    setVideoSeleccionado(video);
    setVista("detalle");
  };

  const videosFiltrados = videos.filter(
    (v) =>
      v.titulo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      v.nombre_usuario?.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#fff", fontFamily: "sans-serif" }}>Cargando panel admin...</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#000", fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>

      {/* Header */}
      <div style={{
        background: "#0a0a0a",
        padding: "14px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid #1a1a1a",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {vista === "detalle" && (
            <button
              onClick={() => { setVista("videos"); setVideoSeleccionado(null); }}
              style={{ background: "none", border: "none", color: "#fff", fontSize: "20px", cursor: "pointer", padding: 0 }}
            >
              ←
            </button>
          )}
          <div>
            <p style={{ color: "#fe2c55", fontSize: "11px", margin: "0 0 2px", fontWeight: 700, letterSpacing: "1px" }}>
              PANEL ADMIN
            </p>
            <span style={{ fontSize: "18px", fontWeight: 900 }}>
              <span style={{ color: "#fe2c55" }}>Tik</span>
              <span style={{ color: "#fff" }}>Tok</span>
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span style={{ color: "#555", fontSize: "12px" }}>
            {videos.length} videos
          </span>
          <button
            onClick={() => router.push("/mvp")}
            style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "8px", padding: "6px 12px", color: "#fff", fontSize: "13px", cursor: "pointer" }}
          >
            Ver feed
          </button>
        </div>
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div style={{ background: mensaje.startsWith("❌") ? "#2a0a0a" : "#0a2a1a", padding: "10px 20px", textAlign: "center" }}>
          <p style={{ color: mensaje.startsWith("❌") ? "#fe2c55" : "#25f4ee", fontSize: "14px", margin: 0 }}>{mensaje}</p>
        </div>
      )}

      {/* ======================== VISTA: LISTA DE VIDEOS ======================== */}
      {vista === "videos" && (
        <>
          {/* Buscador */}
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #1a1a1a" }}>
            <input
              type="text"
              placeholder="🔍 Buscar por título o usuario..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                width: "100%", background: "#1a1a1a", border: "1px solid #2a2a2a",
                borderRadius: "8px", padding: "10px 14px", color: "#fff",
                fontSize: "14px", outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          {/* Stats rápidas */}
          <div style={{ display: "flex", gap: "1px", borderBottom: "1px solid #1a1a1a" }}>
            {[
              { label: "Videos", valor: videos.length },
              { label: "Comentarios", valor: Object.values(comentarios).reduce((a, c) => a + c.length, 0) },
              { label: "Likes", valor: Object.values(likes).reduce((a, l) => a + l, 0) },
            ].map((stat) => (
              <div key={stat.label} style={{ flex: 1, padding: "14px", textAlign: "center", background: "#0a0a0a" }}>
                <p style={{ color: "#fff", fontSize: "20px", fontWeight: 700, margin: 0 }}>{stat.valor}</p>
                <p style={{ color: "#555", fontSize: "11px", margin: "3px 0 0" }}>{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Lista de videos */}
          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {videosFiltrados.length === 0 && (
              <p style={{ color: "#555", textAlign: "center", padding: "40px" }}>No hay videos.</p>
            )}
            {videosFiltrados.map((v) => (
              <div
                key={v.id}
                style={{
                  background: "#111", borderRadius: "12px", border: "1px solid #1a1a1a",
                  padding: "14px", display: "flex", gap: "12px", alignItems: "flex-start",
                  cursor: "pointer",
                }}
                onClick={() => abrirDetalle(v)}
              >
                {/* Miniatura */}
                <div style={{ width: "60px", height: "80px", background: "#1a1a1a", borderRadius: "8px", overflow: "hidden", flexShrink: 0 }}>
                  {v.url_miniatura
                    ? <img src={v.url_miniatura} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>🎬</div>
                  }
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: "#fff", fontWeight: 700, fontSize: "14px", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {v.titulo}
                  </p>
                  <p style={{ color: "#888", fontSize: "12px", margin: "0 0 8px" }}>
                    @{v.nombre_usuario ?? "usuario"} · {new Date(v.creado_en).toLocaleDateString()}
                  </p>
                  {/* Stats del video */}
                  <div style={{ display: "flex", gap: "14px" }}>
                    <span style={{ color: "#fe2c55", fontSize: "12px", fontWeight: 600 }}>
                      ❤️ {likes[v.id] ?? 0}
                    </span>
                    <span style={{ color: "#888", fontSize: "12px" }}>
                      💬 {(comentarios[v.id] ?? []).length}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px", flexShrink: 0 }}>
                  <span style={{ color: "#555", fontSize: "11px", textAlign: "right" }}>Ver detalle →</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); borrarVideo(v.id); }}
                    style={{
                      background: "#2a0a0a", border: "1px solid #fe2c55",
                      borderRadius: "8px", padding: "5px 10px",
                      color: "#fe2c55", fontSize: "11px", fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    🗑️ Borrar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ======================== VISTA: DETALLE DEL VIDEO ======================== */}
      {vista === "detalle" && videoSeleccionado && (
        <div style={{ padding: "16px" }}>

          {/* Video */}
          <video
            src={videoSeleccionado.url_video}
            controls
            poster={videoSeleccionado.url_miniatura}
            style={{ width: "100%", borderRadius: "12px", background: "#111", marginBottom: "14px" }}
          />

          {/* Info del video */}
          <div style={{ background: "#111", borderRadius: "12px", padding: "14px", marginBottom: "14px", border: "1px solid #1a1a1a" }}>
            <p style={{ color: "#fff", fontWeight: 700, fontSize: "16px", margin: "0 0 4px" }}>{videoSeleccionado.titulo}</p>
            <p style={{ color: "#888", fontSize: "13px", margin: "0 0 12px" }}>
              @{videoSeleccionado.nombre_usuario ?? "usuario"} · {new Date(videoSeleccionado.creado_en).toLocaleDateString()}
            </p>
            <div style={{ display: "flex", gap: "20px", marginBottom: "14px" }}>
              <span style={{ color: "#fe2c55", fontSize: "14px", fontWeight: 700 }}>
                ❤️ {likes[videoSeleccionado.id] ?? 0} likes
              </span>
              <span style={{ color: "#aaa", fontSize: "14px" }}>
                💬 {(comentarios[videoSeleccionado.id] ?? []).length} comentarios
              </span>
            </div>
            <button
              onClick={() => borrarVideo(videoSeleccionado.id)}
              style={{
                width: "100%", background: "#2a0a0a", border: "1px solid #fe2c55",
                borderRadius: "10px", padding: "10px",
                color: "#fe2c55", fontSize: "14px", fontWeight: 700,
                cursor: "pointer",
              }}
            >
              🗑️ Borrar este video
            </button>
          </div>

          {/* Comentarios del video */}
          <div>
            <p style={{ color: "#fff", fontWeight: 700, fontSize: "15px", marginBottom: "12px" }}>
              Comentarios ({(comentarios[videoSeleccionado.id] ?? []).length})
            </p>

            {(comentarios[videoSeleccionado.id] ?? []).length === 0 ? (
              <p style={{ color: "#555", fontSize: "14px", textAlign: "center", padding: "20px" }}>
                Este video no tiene comentarios.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {(comentarios[videoSeleccionado.id] ?? []).map((c) => (
                  <div key={c.id} style={{
                    background: "#111", borderRadius: "10px", border: "1px solid #1a1a1a",
                    padding: "12px 14px", display: "flex", alignItems: "center", gap: "10px",
                  }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: "#fe2c55", fontSize: "12px", fontWeight: 700, margin: "0 0 3px" }}>
                        @{c.nombre_usuario ?? "usuario"}
                      </p>
                      <p style={{ color: "#ccc", fontSize: "14px", margin: 0 }}>{c.contenido}</p>
                      <p style={{ color: "#444", fontSize: "11px", margin: "4px 0 0" }}>
                        {new Date(c.creado_en).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => borrarComentario(c.id, videoSeleccionado.id)}
                      style={{
                        background: "#2a0a0a", border: "1px solid #fe2c55",
                        borderRadius: "8px", padding: "6px 12px",
                        color: "#fe2c55", fontSize: "12px", fontWeight: 700,
                        cursor: "pointer", flexShrink: 0,
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}