import { redirect } from "next/navigation";
import { sessaoAtual } from "@/lib/conta";

export const dynamic = "force-dynamic";

// Porta de entrada: a equipe da Desenho Ads vai para a administração,
// os clientes vão para o painel.
export default async function Raiz() {
  const sessao = await sessaoAtual();
  redirect(sessao.papel === "admin" ? "/admin" : "/inicio");
}
