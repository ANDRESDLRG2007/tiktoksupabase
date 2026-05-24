"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

interface Video {
  id: string;
  titulo: string;
  url_video: string;
  creado_en: string;
}

export default function UserPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

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
    fetchMisVideos();
  }, [usuarioId]);

  const fetchMisVideos = async () => {
    const { data } = await supabase.from("videos").select("*").eq("usuario_id", usuarioId).order("creado_en", { ascending: false });
    setVideos(data ?? []);
  };

  const borrarVideo = async (videoId: string) => {
    const { error } = await supabase.from("videos").delete().eq("id", videoId).eq("usuario_id", usuarioId!);
    if (error) { setMensaje("❌ Error al borrar"); return; }
    setMensaje("✅ Video borrado");
    fetchMisVideos();
  };

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) return <p className="text-center mt-10">⏳ Cargando...</p>;

  return (
    <div className="max-w-lg mx-auto mt-6 p-4 space-y-6">
      <h1 className="text-2xl font-bold text-center">📱 Mis Videos</h1>
      {mensaje && <p className="text-center">{mensaje}</p>}

      {videos.length === 0 ? (
        <p className="text-center text-gray-500">No has subido videos aún.</p>
      ) : (
        videos.map((v) => (
          <div key={v.id} className="border rounded-lg p-4 shadow space-y-2">
            <h3 className="font-semibold">{v.titulo}</h3>
            <video src={v.url_video} controls className="w-full rounded" />
            <button onClick={() => borrarVideo(v.id)} className="bg-red-500 text-white px-4 py-1 rounded w-full">
              🗑️ Borrar este video
            </button>
          </div>
        ))
      )}

      <button onClick={cerrarSesion} className="bg-gray-400 text-white py-2 rounded w-full">
        Cerrar sesión
      </button>
    </div>
  );
}