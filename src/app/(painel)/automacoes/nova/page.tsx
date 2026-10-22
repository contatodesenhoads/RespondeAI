import Link from "next/link";
import { sessaoAtual } from "@/lib/conta";
import { Cabecalho } from "@/components/ui";
import { FormAutomacao } from "../FormAutomacao";
import { postsDoCliente } from "../posts";

export const metadata = { title: "Nova automação · Responde AI" };
export const dynamic = "force-dynamic";

export default async function NovaAutomacao() {
  const sessao = await sessaoAtual();
  const { posts, erro } = await postsDoCliente(sessao.clienteId);
  const perfil = sessao.instagram?.username ? `@${sessao.instagram.username}` : "o nosso perfil";

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <p className="text-sm text-suave">
          <Link href="/automacoes" className="font-medium">Automações</Link> / Nova
        </p>
        <Cabecalho titulo="Nova automação" />
      </div>
      <FormAutomacao
        posts={posts}
        erroPosts={erro}
        username={sessao.instagram?.username ?? null}
        inicial={{
          nome: "",
          gatilho: "comentario",
          post_id: null,
          palavra_chave: "",
          resposta_publica: "Te mandei no direct! Dá uma olhada lá.",
          mensagem_dm: "Oi! Que bom que você quer o conteúdo. Clica no botão aqui embaixo que eu te mando.",
          botao_dm: "Quero receber",
          exige_seguir: true,
          mensagem_seguir: `Quase lá! Para receber, siga ${perfil} e depois clique em “Já segui”.`,
          botao_seguir: "Já segui",
          conteudo_tipo: "link",
          mensagem_entrega: "Aqui está o seu conteúdo! Qualquer dúvida, é só responder esta mensagem.",
          conteudo_url: "",
        }}
      />
    </>
  );
}
