import "server-only";
import { tokenDoCliente } from "@/lib/conta";
import { listarPosts } from "@/lib/instagram";
import type { PostResumo } from "./FormAutomacao";

const TIPOS: Record<string, string> = { REELS: "Reels", FEED: "Post", STORY: "Story" };

export async function postsDoCliente(clienteId: string): Promise<{ posts: PostResumo[]; erro: boolean }> {
  try {
    const token = await tokenDoCliente(clienteId);
    if (!token) return { posts: [], erro: true };
    const lista = await listarPosts(token, 12);
    return {
      erro: false,
      posts: lista.map((p) => ({
        id: p.id,
        legenda: p.caption ?? "",
        miniatura: p.thumbnail_url ?? (p.media_type === "VIDEO" ? null : p.media_url ?? null),
        tipo:
          TIPOS[p.media_product_type ?? ""] ??
          (p.media_type === "CAROUSEL_ALBUM" ? "Carrossel" : p.media_type === "VIDEO" ? "Vídeo" : "Foto"),
        data: new Date(p.timestamp).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
      })),
    };
  } catch (e) {
    console.error("Falha ao listar posts", e);
    return { posts: [], erro: true };
  }
}
