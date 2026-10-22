"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { salvarAutomacao, type EstadoForm } from "./acoes";

export type PostResumo = {
  id: string;
  legenda: string;
  miniatura: string | null;
  tipo: string;
  data: string;
};

export type ValoresAutomacao = {
  id?: string;
  nome: string;
  gatilho: "comentario" | "direct";
  post_id: string | null;
  palavra_chave: string;
  resposta_publica: string;
  mensagem_dm: string;
  botao_dm: string;
  exige_seguir: boolean;
  mensagem_seguir: string;
  botao_seguir: string;
  conteudo_tipo: "link" | "texto" | "arquivo";
  mensagem_entrega: string;
  conteudo_url: string;
};

const campo = "w-full rounded-[10px] border border-campo bg-white px-3.5 text-[15px] text-tinta";
const rotulo = "text-sm font-semibold";
const ajuda = "text-[13px] text-suave";

function Secao({ titulo, children, destaque }: { titulo: React.ReactNode; children: React.ReactNode; destaque?: boolean }) {
  return (
    <section className={`flex flex-col gap-3.5 rounded-[14px] bg-white p-6 ${destaque ? "border-2 border-marsala" : "border border-linha"}`}>
      {typeof titulo === "string" ? <h2 className="text-[17px] font-bold">{titulo}</h2> : titulo}
      {children}
    </section>
  );
}

function Pilula({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      onClick={onClick}
      className={`h-11 rounded-full border px-[18px] text-sm ${
        ativo ? "border-marsala bg-marsala font-semibold text-off" : "border-campo bg-white font-medium text-tinta"
      }`}
    >
      {children}
    </button>
  );
}

export function FormAutomacao({
  inicial,
  posts,
  erroPosts,
  username,
}: {
  inicial: ValoresAutomacao;
  posts: PostResumo[];
  erroPosts: boolean;
  username: string | null;
}) {
  const [estado, acao, enviando] = useActionState<EstadoForm, FormData>(salvarAutomacao, {});
  const [v, setV] = useState(inicial);
  const muda = <K extends keyof ValoresAutomacao>(k: K, valor: ValoresAutomacao[K]) => setV((x) => ({ ...x, [k]: valor }));
  const postEscolhido = posts.find((p) => p.id === v.post_id);
  const perfil = username ? `@${username}` : "o perfil";

  return (
    <form action={acao} className="flex flex-wrap items-start gap-6">
      <input type="hidden" name="id" value={v.id ?? ""} />
      <input type="hidden" name="gatilho" value={v.gatilho} />
      <input type="hidden" name="post_id" value={v.post_id ?? ""} />
      <input type="hidden" name="post_legenda" value={postEscolhido?.legenda ?? ""} />
      <input type="hidden" name="post_miniatura" value={postEscolhido?.miniatura ?? ""} />
      <input type="hidden" name="conteudo_tipo" value={v.conteudo_tipo} />

      <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-4">
        <Secao titulo="Nome e gatilho">
          <label htmlFor="nome" className={rotulo}>Nome da automação</label>
          <input id="nome" name="nome" required value={v.nome} onChange={(e) => muda("nome", e.target.value)} placeholder="Ex.: Prompt de roteiros" className={`${campo} h-[46px]`} />
          <span className={rotulo}>Quando acionar</span>
          <div className="flex flex-wrap gap-2">
            <Pilula ativo={v.gatilho === "comentario"} onClick={() => muda("gatilho", "comentario")}>Comentário em post</Pilula>
            <Pilula ativo={v.gatilho === "direct"} onClick={() => muda("gatilho", "direct")}>Mensagem no direct</Pilula>
          </div>
        </Secao>

        {v.gatilho === "comentario" && (
          <Secao titulo="1. Escolha o post">
            {erroPosts && <p className="rounded-lg bg-alerta-fundo px-3 py-2 text-sm text-alerta">Não foi possível carregar seus posts agora. Você pode usar “Qualquer post”.</p>}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2.5">
              <button
                type="button"
                aria-pressed={!v.post_id}
                onClick={() => muda("post_id", null)}
                className={`flex aspect-[4/5] items-center justify-center rounded-[10px] p-2 text-center text-[13px] font-semibold ${
                  !v.post_id ? "border-[3px] border-marsala bg-off" : "border border-linha bg-off-2 text-tinta-2"
                }`}
              >
                Qualquer post
              </button>
              {posts.map((p) => {
                const ativo = v.post_id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={ativo}
                    aria-label={`Post de ${p.data}: ${p.legenda.slice(0, 60)}`}
                    onClick={() => muda("post_id", p.id)}
                    className={`relative aspect-[4/5] overflow-hidden rounded-[10px] bg-[#EAE3E4] ${ativo ? "border-[3px] border-marsala" : "border border-linha"}`}
                  >
                    {p.miniatura && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.miniatura} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    )}
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-6 text-left text-xs font-semibold text-white">
                      {p.tipo} · {p.data}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className={ajuda}>As miniaturas vêm do seu Instagram conectado.</p>
          </Secao>
        )}

        <Secao titulo={v.gatilho === "comentario" ? "2. Palavra-chave" : "1. Palavra-chave"}>
          <label htmlFor="palavra_chave" className={rotulo}>
            {v.gatilho === "comentario" ? "Quando alguém comentar" : "Quando alguém mandar no direct"}
          </label>
          <input id="palavra_chave" name="palavra_chave" required value={v.palavra_chave} onChange={(e) => muda("palavra_chave", e.target.value)} placeholder="prompt" className={`${campo} h-[46px]`} />
          <p className={ajuda}>Funciona com maiúsculas, minúsculas e acentos: “Prompt”, “PROMPT” e “prompt!” acionam igual.</p>
        </Secao>

        {v.gatilho === "comentario" && (
          <Secao titulo="3. Resposta pública ao comentário">
            <label htmlFor="resposta_publica" className={rotulo}>O que aparece embaixo do comentário (opcional)</label>
            <textarea id="resposta_publica" name="resposta_publica" rows={2} value={v.resposta_publica} onChange={(e) => muda("resposta_publica", e.target.value)} className={`${campo} py-3`} />
          </Secao>
        )}

        <Secao titulo={`${v.gatilho === "comentario" ? "4" : "2"}. Primeira mensagem no direct`}>
          <label htmlFor="mensagem_dm" className={rotulo}>Mensagem</label>
          <textarea id="mensagem_dm" name="mensagem_dm" required rows={2} maxLength={640} value={v.mensagem_dm} onChange={(e) => muda("mensagem_dm", e.target.value)} className={`${campo} py-3`} />
          <label htmlFor="botao_dm" className={rotulo}>Texto do botão</label>
          <input id="botao_dm" name="botao_dm" maxLength={20} value={v.botao_dm} onChange={(e) => muda("botao_dm", e.target.value)} className={`${campo} h-[46px]`} />
          <p className={ajuda}>Até 20 caracteres. O clique neste botão é o que permite conferir se a pessoa segue o perfil.</p>
        </Secao>

        <Secao
          destaque
          titulo={
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-[17px] font-bold">{v.gatilho === "comentario" ? "5" : "3"}. Exigir que siga o perfil</h2>
                <p className="text-sm text-suave">Quem não segue recebe um convite antes do conteúdo.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={v.exige_seguir}
                aria-label="Exigir que siga o perfil"
                onClick={() => muda("exige_seguir", !v.exige_seguir)}
                className={`relative h-8 w-14 shrink-0 rounded-2xl transition ${v.exige_seguir ? "bg-marsala" : "bg-[#8E8184]"}`}
              >
                <span className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-all ${v.exige_seguir ? "left-7" : "left-1"}`} />
              </button>
            </div>
          }
        >
          {v.exige_seguir && <input type="hidden" name="exige_seguir" value="on" />}
          {v.exige_seguir && (
            <div className="flex flex-col gap-3.5 border-t border-linha-2 pt-3.5">
              <label htmlFor="mensagem_seguir" className={rotulo}>Mensagem para quem ainda não segue</label>
              <textarea id="mensagem_seguir" name="mensagem_seguir" rows={2} maxLength={640} value={v.mensagem_seguir} onChange={(e) => muda("mensagem_seguir", e.target.value)} className={`${campo} py-3`} />
              <label htmlFor="botao_seguir" className={rotulo}>Texto do botão</label>
              <input id="botao_seguir" name="botao_seguir" maxLength={20} value={v.botao_seguir} onChange={(e) => muda("botao_seguir", e.target.value)} className={`${campo} h-[46px]`} />
            </div>
          )}
        </Secao>

        <Secao titulo={`${v.gatilho === "comentario" ? "6" : "4"}. Conteúdo a entregar`}>
          <div className="flex flex-wrap gap-2">
            <Pilula ativo={v.conteudo_tipo === "link"} onClick={() => muda("conteudo_tipo", "link")}>Link</Pilula>
            <Pilula ativo={v.conteudo_tipo === "texto"} onClick={() => muda("conteudo_tipo", "texto")}>Texto</Pilula>
            <Pilula ativo={v.conteudo_tipo === "arquivo"} onClick={() => muda("conteudo_tipo", "arquivo")}>Arquivo</Pilula>
          </div>
          <label htmlFor="mensagem_entrega" className={rotulo}>Mensagem de entrega</label>
          <textarea id="mensagem_entrega" name="mensagem_entrega" required rows={v.conteudo_tipo === "texto" ? 5 : 2} maxLength={900} value={v.mensagem_entrega} onChange={(e) => muda("mensagem_entrega", e.target.value)} className={`${campo} py-3`} />
          {v.conteudo_tipo !== "texto" && (
            <>
              <label htmlFor="conteudo_url" className={rotulo}>{v.conteudo_tipo === "arquivo" ? "Link do arquivo (Google Drive, Dropbox…)" : "Link"}</label>
              <input id="conteudo_url" name="conteudo_url" type="url" value={v.conteudo_url} onChange={(e) => muda("conteudo_url", e.target.value)} placeholder="https://" className={`${campo} h-[46px]`} />
              <p className={ajuda}>O link vai num endereço do Responde AI para contar os cliques no dashboard.</p>
            </>
          )}
        </Secao>

        {estado.erro && <p role="alert" className="rounded-xl bg-erro-fundo px-4 py-3 text-sm text-erro">{estado.erro}</p>}

        <div className="flex flex-wrap justify-end gap-3">
          <Link href="/automacoes" className="flex h-12 items-center px-3 text-[15px] font-semibold">Cancelar</Link>
          <button type="submit" name="acao" value="rascunho" disabled={enviando} className="h-12 rounded-[10px] border border-campo bg-white px-[22px] text-[15px] font-semibold text-tinta disabled:opacity-60">
            Salvar rascunho
          </button>
          <button type="submit" name="acao" value="ativar" disabled={enviando} className="h-12 rounded-[10px] bg-marsala px-[22px] text-[15px] font-semibold text-off hover:bg-marsala-escuro disabled:opacity-60">
            {enviando ? "Salvando…" : "Salvar e ativar"}
          </button>
        </div>
      </div>

      <aside aria-label="Prévia da conversa" className="flex min-w-0 flex-[1_1_320px] flex-col gap-3.5 rounded-[20px] border border-linha bg-white p-5 lg:sticky lg:top-6">
        <div className="flex items-center gap-2.5 border-b border-linha-2 pb-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-marsala text-xs font-bold text-off" aria-hidden="true">
            {(username ?? "R").slice(0, 1).toUpperCase()}
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{perfil}</span>
            <span className="text-xs text-suave">Prévia no direct</span>
          </div>
        </div>
        <Balao>{v.mensagem_dm || "Primeira mensagem…"}</Balao>
        <BotaoPrevia>{v.botao_dm || "Quero receber"}</BotaoPrevia>
        {v.exige_seguir && (
          <>
            <span className="self-center text-xs text-suave">se a pessoa ainda não segue</span>
            <Balao>{v.mensagem_seguir || "Mensagem para quem não segue…"}</Balao>
            <BotaoPrevia>{v.botao_seguir || "Já segui"}</BotaoPrevia>
          </>
        )}
        <span className="self-center text-xs text-suave">entrega</span>
        <div className="max-w-[86%] self-start whitespace-pre-line rounded-2xl rounded-bl bg-marsala px-3.5 py-3 text-sm leading-normal text-off">
          {v.mensagem_entrega || "Mensagem de entrega…"}
          {v.conteudo_tipo !== "texto" && v.conteudo_url && <span className="mt-1 block underline">link do conteúdo</span>}
        </div>
      </aside>
    </form>
  );
}

function Balao({ children }: { children: React.ReactNode }) {
  return <div className="max-w-[86%] self-start whitespace-pre-line rounded-2xl rounded-bl bg-off px-3.5 py-3 text-sm leading-normal">{children}</div>;
}

function BotaoPrevia({ children }: { children: React.ReactNode }) {
  return <div className="self-start rounded-[10px] border border-marsala px-3.5 py-2 text-sm font-semibold text-marsala">{children}</div>;
}
