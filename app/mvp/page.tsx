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
}

interface Comentario {
  id: string;
  contenido: string;
  usuario_id: string;
}

export default function MVPPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [misLikes, setMisLikes] = useState<string[]>([]);
  const [comentarios, setComentarios] = useState<Record<string, Comentario[]>>({});
  const [nuevoComentario, setNuevoComentario] = useState<Record<string, string>>({});
  const [tituloVideo, setTituloVideo] = useState("");
  const [urlVideo, setUrlVideo] = useState("");
  const [urlMiniatura, setUrlMiniatura] = useState("");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { router.push("/login"); return; }
      setUsuarioId(data.user.id);
      setLoading(false);
    };
    checkUser();
  }, [router]);

  useEffect(() => {
    if (!usuarioId) return;
    fetchVideos();
  }, [usuarioId]);

  const fetchVideos = async () => {
    const { data } = await supabase.from("videos").select("*").order("creado_en", { ascending: false });
    if (data) {
      setVideos(data);
      data.forEach((v) => {
        fetchLikes(v.id);
        fetchComentarios(v.id);
      });
    }
  };

  const fetchLikes = async (videoId: string) => {
    const { count } = await supabase.from("likes").select("*", { count: "exact", head: true }).eq("video_id", videoId);
    setLikes((prev) => ({ ...prev, [videoId]: count ?? 0 }));
    if (usuarioId) {
      const { data } = await supabase.from("likes").select("id").eq("video_id", videoId).eq("usuario_id", usuarioId).single();
      if (data) setMisLikes((prev) => [...prev.filter((id) => id !== videoId), videoId]);
    }
  };

  const fetchComentarios = async (videoId: string) => {
    const { data } = await supabase.from("comentarios").select("*").eq("video_id", videoId).order("creado_en", { ascending: true });
    setComentarios((prev) => ({ ...prev, [videoId]: data ?? [] }));
  };

  const toggleLike = async (videoId: string) => {
    if (!usuarioId) return;
    const yaDioLike = misLikes.includes(videoId);
    if (yaDioLike) {
      await supabase.from("likes").delete().eq("video_id", videoId).eq("usuario_id", usuarioId);
      setMisLikes((prev) => prev.filter((id) => id !== videoId));
    } else {
      await supabase.from("likes").insert([{ video_id: videoId, usuario_id: usuarioId }]);
      setMisLikes((prev) => [...prev, videoId]);
    }
    fetchLikes(videoId);
  };

  const comentar = async (videoId: string) => {
    const texto = nuevoComentario[videoId];
    if (!texto?.trim() || !usuarioId) return;
    await supabase.from("comentarios").insert([{ video_id: videoId, usuario_id: usuarioId, contenido: texto }]);
    setNuevoComentario((prev) => ({ ...prev, [videoId]: "" }));
    fetchComentarios(videoId);
  };

  const subirVideo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!usuarioId) return;
    const { error } = await supabase.from("videos").insert([{ usuario_id: usuarioId, titulo: tituloVideo, url_video: urlVideo, url_miniatura: urlMiniatura }]);
    if (error) { setMensaje("❌ Error al subir: " + error.message); return; }
    setMensaje("✅ Video subido");
    setTituloVideo(""); setUrlVideo(""); setUrlMiniatura("");
    fetchVideos();
  };

  if (loading) return <p className="text-center mt-10">⏳ Cargando...</p>;

  return (
    <div className="max-w-xl mx-auto mt-6 p-4 space-y-8">
      <h1 className="text-2xl font-bold text-center">🎵 TikTok MVP</h1>

      {/* Subir video */}
      <form onSubmit={subirVideo} className="border p-4 rounded-lg shadow flex flex-col gap-3">
        <h2 className="font-semibold text-lg">📤 Subir video</h2>
        <input type="text" placeholder="Título del video" value={tituloVideo} onChange={(e) => setTituloVideo(e.target.value)} required className="border p-2 rounded" />
        <input type="text" placeholder="URL del video (mp4)" value={urlVideo} onChange={(e) => setUrlVideo(e.target.value)} required className="border p-2 rounded" />
        <input type="text" placeholder="URL de miniatura (opcional)" value={urlMiniatura} onChange={(e) => setUrlMiniatura(e.target.value)} className="border p-2 rounded" />
        <button type="submit" className="bg-black text-white py-2 rounded">Subir</button>
        {mensaje && <p className="text-center">{mensaje}</p>}
      </form>

      {/* Feed de videos */}
      {videos.map((video) => (
        <div key={video.id} className="border rounded-lg shadow p-4 space-y-3">
          <h3 className="font-bold text-lg">{video.titulo}</h3>
          <video src={video.url_video} controls className="w-full rounded" poster={video.url_miniatura} />

          {/* Like */}
          <button onClick={() => toggleLike(video.id)} className={`text-xl ${misLikes.includes(video.id) ? "text-red-500" : "text-gray-400"}`}>
            ❤️ {likes[video.id] ?? 0} likes
          </button>

          {/* Comentarios */}
          <div className="space-y-1">
            {(comentarios[video.id] ?? []).map((c) => (
              <p key={c.id} className="text-sm bg-gray-100 p-2 rounded">💬 {c.contenido}</p>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="text" placeholder="Escribe un comentario..." value={nuevoComentario[video.id] ?? ""} onChange={(e) => setNuevoComentario((prev) => ({ ...prev, [video.id]: e.target.value }))} className="border p-2 rounded flex-1 text-sm" />
            <button onClick={() => comentar(video.id)} className="bg-blue-600 text-white px-3 rounded text-sm">Enviar</button>
          </div>
        </div>
      ))}
    </div>
  );
}