"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

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
  usuario_id: string;
  nombre_usuario: string | null;
}

export default function MVPPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [misLikes, setMisLikes] = useState<string[]>([]);
  const [comentarios, setComentarios] = useState<Record<string, Comentario[]>>({});
  const [mostrarComentarios, setMostrarComentarios] = useState<Record<string, boolean>>({});
  const [nuevoComentario, setNuevoComentario] = useState<Record<string, string>>({});
  const [tituloVideo, setTituloVideo] = useState("");
  const [urlVideo, setUrlVideo] = useState("");
  const [urlMiniatura, setUrlMiniatura] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [nombreUsuario, setNombreUsuario] = useState<string>("usuario");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { router.push("/login"); return; }
      setUsuarioId(data.user.id);
      // Obtener nombre del usuario
      const { data: usuarioData } = await supabase
        .from("usuarios")
        .select("nombre")
        .eq("id", data.user.id)
        .maybeSingle();
      if (usuarioData?.nombre) {
        setNombreUsuario(usuarioData.nombre);
      } else {
        // Fallback: usar la parte del correo antes del @
        const emailNombre = data.user.email?.split("@")[0] ?? "usuario";
        setNombreUsuario(emailNombre);
        // Intentar insertar el usuario si no existe
        await supabase.from("usuarios").upsert([{
          id: data.user.id,
          nombre: emailNombre,
          correo: data.user.email ?? "",
        }], { onConflict: "id" });
      }
      setLoading(false);
    };
    checkUser();
  }, [router]);

  useEffect(() => {
    if (!usuarioId) return;
    fetchVideos();
  }, [usuarioId]);

  const fetchVideos = async () => {
    const { data } = await supabase
      .from("videos")
      .select("*")
      .order("creado_en", { ascending: false });
    if (data) {
      setVideos(data);
      data.forEach((v) => {
        fetchLikes(v.id);
        fetchComentarios(v.id);
      });
    }
  };

  const fetchLikes = async (videoId: string) => {
    const { count } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("video_id", videoId);
    setLikes((prev) => ({ ...prev, [videoId]: count ?? 0 }));
    if (usuarioId) {
      const { data } = await supabase
        .from("likes")
        .select("id")
        .eq("video_id", videoId)
        .eq("usuario_id", usuarioId)
        .maybeSingle();
      if (data) setMisLikes((prev) => [...prev.filter((id) => id !== videoId), videoId]);
    }
  };

  const fetchComentarios = async (videoId: string) => {
    const { data } = await supabase
      .from("comentarios")
      .select("*")
      .eq("video_id", videoId)
      .order("creado_en", { ascending: true });
    setComentarios((prev) => ({ ...prev, [videoId]: data ?? [] }));
  };

  const toggleLike = async (videoId: string) => {
    if (!usuarioId) return;
    const yaDioLike = misLikes.includes(videoId);
    if (yaDioLike) {
      await supabase.from("likes").delete().eq("video_id", videoId).eq("usuario_id", usuarioId);
      setMisLikes((prev) => prev.filter((id) => id !== videoId));
      setLikes((prev) => ({ ...prev, [videoId]: (prev[videoId] ?? 1) - 1 }));
    } else {
      await supabase.from("likes").insert([{ video_id: videoId, usuario_id: usuarioId }]);
      setMisLikes((prev) => [...prev, videoId]);
      setLikes((prev) => ({ ...prev, [videoId]: (prev[videoId] ?? 0) + 1 }));
    }
  };

  const comentar = async (videoId: string) => {
    const texto = nuevoComentario[videoId];
    if (!texto?.trim() || !usuarioId) return;
    await supabase.from("comentarios").insert([{
      video_id: videoId,
      usuario_id: usuarioId,
      contenido: texto,
      nombre_usuario: nombreUsuario,
    }]);
    setNuevoComentario((prev) => ({ ...prev, [videoId]: "" }));
    fetchComentarios(videoId);
  };

  const subirVideo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!usuarioId) return;
    const { error } = await supabase.from("videos").insert([{
      usuario_id: usuarioId,
      titulo: tituloVideo,
      url_video: urlVideo,
      url_miniatura: urlMiniatura,
      nombre_usuario: nombreUsuario,
    }]);
    if (error) { setMensaje("❌ Error: " + error.message); return; }
    setMensaje("✅ Video subido");
    setTituloVideo(""); setUrlVideo(""); setUrlMiniatura("");
    setMostrarFormulario(false);
    setTimeout(() => setMensaje(null), 3000);
    fetchVideos();
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#fff", fontFamily: "sans-serif" }}>Cargando...</p>
    </div>
  );

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#2a2a2a",
    border: "1px solid #3a3a3a",
    borderRadius: "8px",
    padding: "12px 14px",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#000", fontFamily: "'Helvetica Neue', Arial, sans-serif", paddingBottom: "80px" }}>

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
        <span style={{ fontSize: "22px", fontWeight: 900, letterSpacing: "-1px" }}>
          <span style={{ color: "#fe2c55" }}>Tik</span>
          <span style={{ color: "#fff" }}>Tok</span>
        </span>
        <button
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          style={{
            background: "#fe2c55",
            border: "none",
            borderRadius: "8px",
            padding: "8px 16px",
            color: "#fff",
            fontWeight: 700,
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          + Subir
        </button>
      </div>

      {/* Formulario subir video */}
      {mostrarFormulario && (
        <div style={{
          background: "#111",
          borderBottom: "1px solid #2a2a2a",
          padding: "20px",
        }}>
          <h3 style={{ color: "#fff", fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>Subir video</h3>
          <form onSubmit={subirVideo} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <input type="text" placeholder="Título del video" value={tituloVideo} onChange={(e) => setTituloVideo(e.target.value)} required style={inputStyle} />
            <input type="text" placeholder="URL del video (.mp4) o GIF (.gif)" value={urlVideo} onChange={(e) => setUrlVideo(e.target.value)} required style={inputStyle} />
            <input type="text" placeholder="URL miniatura (opcional)" value={urlMiniatura} onChange={(e) => setUrlMiniatura(e.target.value)} style={inputStyle} />
            <button type="submit" style={{ background: "#fe2c55", border: "none", borderRadius: "8px", padding: "12px", color: "#fff", fontWeight: 700, fontSize: "15px", cursor: "pointer" }}>
              Publicar
            </button>
          </form>
          {mensaje && <p style={{ color: "#25f4ee", marginTop: "12px", fontSize: "14px" }}>{mensaje}</p>}
        </div>
      )}

      {/* Feed */}
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "0 0 20px" }}>
        {videos.length === 0 && (
          <p style={{ color: "#555", textAlign: "center", padding: "60px 20px", fontSize: "16px" }}>
            No hay videos aún. ¡Sé el primero en subir uno!
          </p>
        )}

        {videos.map((video) => (
          <div key={video.id} style={{
            borderBottom: "1px solid #1a1a1a",
            padding: "16px 0",
          }}>
            {/* Autor */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "0 16px 10px" }}>
              <div style={{
                width: "38px", height: "38px", borderRadius: "50%",
                background: "#fe2c55",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "16px", fontWeight: 700, color: "#fff",
                flexShrink: 0,
              }}>
                {(video.nombre_usuario ?? "U")[0].toUpperCase()}
              </div>
              <div>
                <p style={{ color: "#fff", fontSize: "14px", fontWeight: 700, margin: 0 }}>
                  @{video.nombre_usuario ?? "usuario"}
                </p>
                <p style={{ color: "#888", fontSize: "12px", margin: 0 }}>{video.titulo}</p>
              </div>
            </div>

            {/* Video o GIF */}
            {video.url_video.toLowerCase().endsWith(".gif") ? (
              <img
                src={video.url_video}
                alt={video.titulo}
                style={{ width: "100%", maxHeight: "520px", background: "#111", display: "block", objectFit: "contain" }}
              />
            ) : (
              <video
                src={video.url_video}
                controls
                poster={video.url_miniatura}
                style={{ width: "100%", maxHeight: "520px", background: "#111", display: "block" }}
              />
            )}

            {/* Acciones */}
            <div style={{ display: "flex", alignItems: "center", gap: "24px", padding: "12px 16px" }}>
              {/* Like */}
              <button
                onClick={() => toggleLike(video.id)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
                  padding: 0,
                }}
              >
                <span style={{ fontSize: "26px" }}>
                  {misLikes.includes(video.id) ? "❤️" : "🤍"}
                </span>
                <span style={{ color: "#fff", fontSize: "12px", fontWeight: 600 }}>
                  {likes[video.id] ?? 0}
                </span>
              </button>

              {/* Comentarios toggle */}
              <button
                onClick={() => setMostrarComentarios((prev) => ({ ...prev, [video.id]: !prev[video.id] }))}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
                  padding: 0,
                }}
              >
                <span style={{ fontSize: "26px" }}>💬</span>
                <span style={{ color: "#fff", fontSize: "12px", fontWeight: 600 }}>
                  {(comentarios[video.id] ?? []).length}
                </span>
              </button>
            </div>

            {/* Sección comentarios */}
            {mostrarComentarios[video.id] && (
              <div style={{ padding: "0 16px 12px" }}>
                <div style={{ maxHeight: "180px", overflowY: "auto", marginBottom: "10px" }}>
                  {(comentarios[video.id] ?? []).length === 0 ? (
                    <p style={{ color: "#555", fontSize: "13px" }}>Sin comentarios aún.</p>
                  ) : (
                    (comentarios[video.id] ?? []).map((c) => (
                      <div key={c.id} style={{
                        background: "#1a1a1a", borderRadius: "8px",
                        padding: "8px 12px", marginBottom: "6px",
                      }}>
                        <p style={{ color: "#fe2c55", fontSize: "11px", fontWeight: 700, margin: "0 0 2px" }}>
                          @{c.nombre_usuario ?? "usuario"}
                        </p>
                        <p style={{ color: "#ccc", fontSize: "13px", margin: 0 }}>{c.contenido}</p>
                      </div>
                    ))
                  )}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    placeholder="Agregar comentario..."
                    value={nuevoComentario[video.id] ?? ""}
                    onChange={(e) => setNuevoComentario((prev) => ({ ...prev, [video.id]: e.target.value }))}
                    style={{
                      flex: 1, background: "#2a2a2a", border: "1px solid #3a3a3a",
                      borderRadius: "20px", padding: "8px 14px", color: "#fff",
                      fontSize: "13px", outline: "none",
                    }}
                    onKeyDown={(e) => { if (e.key === "Enter") comentar(video.id); }}
                  />
                  <button
                    onClick={() => comentar(video.id)}
                    style={{
                      background: "#fe2c55", border: "none", borderRadius: "20px",
                      padding: "8px 16px", color: "#fff", fontWeight: 700,
                      fontSize: "13px", cursor: "pointer",
                    }}
                  >
                    ↑
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}