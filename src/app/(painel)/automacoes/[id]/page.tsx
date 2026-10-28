import Link from "next/link";
import { notFound } from "next/navigation";
import { sessaoAtual } from "@/lib/conta";
import { supabaseServidor } from "@/lib/supabase/server";
import { Cabecalho, SeloStatus } from "@/components/ui";
import { BotaoConfirmar } from "@/components/BotaoConfirmar";
import { FormAutomacao } from "../FormAutomacao";
import { postsDoCliente } from "../posts";
import { planoDe } from "@/lib/planos";
import { MENSAGEM_CAPTURA_PADRAO } from "@/lib/regras";
import { excluirAutomacao } from "../acoes";

export const metadata = { title: "Editar automação · Responde AI" };
export const dynamic = "force-dynamic";

export default async function EditarAutomacao({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessao = await sessaoAtual();
  const supabase = await supabaseServidor();
  const { data: a } = await supabase.from("automacoes").select("*").eq("id", id).maybeSingle();
  if (!a) notFound();

  const { posts, erro } = await postsDoCliente(sessao.clienteId);
  // Mantém o post escolhido visível mesmo que não esteja entre os 12 mais recentes.
  if (a.post_id && !posts.some((p) => p.id === a.post_id)) {
    posts.unshift({ id: a.post_id, legenda: a.post_legenda ?? "", miniatura: a.post_miniatura, tipo: "Post", data: "escolhido" });
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <p className="text-sm text-suave">
          <Link href="/automacoes" className="font-medium">Automações</Link> / Editar
        </p>
        <Cabecalho titulo={a.nome} acao={<SeloStatus status={a.status} />} />
      </div>
      <FormAutomacao
        posts={posts}
        erroPosts={erro}
        username={sessao.instagram?.username ?? null}
        recursos={planoDe(sessao.plano).recursos}
        inicial={{
          id: a.id,
          nome: a.nome,
          gatilho: a.gatilho,
          post_id: a.post_id,
          palavra_chave: a.palavra_chave,
          resposta_publica: a.resposta_publica ?? "",
          resposta_publica_2: a.resposta_publica_2 ?? "",
          mensagem_dm: a.mensagem_dm,
          botao_dm: a.botao_dm,
          exige_seguir: a.exige_seguir,
          mensagem_seguir: a.mensagem_seguir ?? "",
          botao_seguir: a.botao_seguir,
          captura_ativa: Boolean(a.captura_ativa),
          captura_mensagem: a.captura_tipo === "whatsapp" ? MENSAGEM_CAPTURA_PADRAO.email : (a.captura_mensagem ?? MENSAGEM_CAPTURA_PADRAO.email),
          captura_mensagem_whatsapp:
            a.captura_mensagem_whatsapp ?? (a.captura_tipo === "whatsapp" && a.captura_mensagem ? a.captura_mensagem : MENSAGEM_CAPTURA_PADRAO.whatsapp),
          conteudo_tipo: a.conteudo_tipo === "midia" ? "midia" : a.conteudo_tipo === "texto" ? "texto" : "link",
          mensagem_entrega: a.mensagem_entrega,
          conteudo_url: a.conteudo_url ?? "",
          midia_path: a.midia_path ?? "",
          midia_tipo: a.midia_tipo ?? "",
          midia_nome: a.midia_nome ?? "",
          midia_tamanho: Number(a.midia_tamanho ?? 0),
          midia_url: a.midia_url ?? "",
          remarketing_ativo: Boolean(a.remarketing_ativo),
          remarketing_mensagem: a.remarketing_mensagem ?? "E aí, o que achou do conteúdo? Se tiver qualquer dúvida, é só me responder aqui.",
          remarketing_horas: Number(a.remarketing_horas ?? 2),
        }}
      />
      <form action={excluirAutomacao} className="flex justify-start border-t border-linha pt-6">
        <input type="hidden" name="id" value={a.id} />
        <BotaoConfirmar
          pergunta="Excluir esta automação? O histórico dela no dashboard continua, mas ela para de responder."
          className="min-h-11 text-sm font-semibold text-erro hover:underline"
        >
          Excluir esta automação
        </BotaoConfirmar>
      </form>
    </>
  );
}
