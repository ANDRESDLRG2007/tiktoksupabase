"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

const ADMIN_EMAIL = "TU_CORREO@aqui.com"; // ← cambia esto

interface Video { id: string; titulo: string; url_video: string; usuario_id: string; }
interface Comentario { id: string; contenido: string; video_id: string; usuario_id: string; }

export default function AdminPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    const verificar = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user || data.user.email !== ADMIN_EMAIL) { router.push("/login"); return; }
      fetchTodo();
    };
    verificar();
  }, [router]);

  const fetchTodo = async () => {
    const { data: v } = await supabase.from("videos").select("*").order("creado_en", { ascending: false });
    const { data: c } = await supabase.from("comentarios").select("*").order("creado_en", { ascending: false });
    setVideos(v ?? []);
    setComentarios(c ?? []);
    setLoading(false);
  };

  const borrarVideo = async (id: string) => {
    await supabase.from("videos").delete().eq("id", id);
    setMensaje("✅ Video borrado");
    fetchTodo();
  };

  const borrarComentario = async (id: string) => {
    await supabase.from("comentarios").delete().eq("id", id);
    setMensaje("✅ Comentario borrado");
    fetchTodo();
  };

  if (loading) return <p className="text-center mt-10">⏳ Cargando...</p>;

  return (
    <div className="max-w-4xl mx-auto mt-6 p-4 space-y-10">
      <h1 className="text-3xl font-bold text-center">🛠️ Panel Admin</h1>
      {mensaje && <p className="text-center text-green-600">{mensaje}</p>}

      {/* Videos */}
      <section>
        <h2 className="text-xl font-semibold mb-3">🎬 Todos los videos</h2>
        <table className="w-full border-collapse border text-sm">
          <thead><tr className="bg-gray-200">
            <th className="border p-2">Título</th>
            <th className="border p-2">Usuario ID</th>
            <th className="border p-2">Acción</th>
          </tr></thead>
          <tbody>
            {videos.map((v) => (
              <tr key={v.id}>
                <td className="border p-2">{v.titulo}</td>
                <td className="border p-2 text-xs">{v.usuario_id}</td>
                <td className="border p-2">
                  <button onClick={() => borrarVideo(v.id)} className="bg-red-500 text-white px-2 py-1 rounded text-xs">Borrar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Comentarios */}
      <section>
        <h2 className="text-xl font-semibold mb-3">💬 Todos los comentarios</h2>
        <table className="w-full border-collapse border text-sm">
          <thead><tr className="bg-gray-200">
            <th className="border p-2">Comentario</th>
            <th className="border p-2">Usuario ID</th>
            <th className="border p-2">Acción</th>
          </tr></thead>
          <tbody>
            {comentarios.map((c) => (
              <tr key={c.id}>
                <td className="border p-2">{c.contenido}</td>
                <td className="border p-2 text-xs">{c.usuario_id}</td>
                <td className="border p-2">
                  <button onClick={() => borrarComentario(c.id)} className="bg-red-500 text-white px-2 py-1 rounded text-xs">Borrar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}