"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { salvarAutomacao, type EstadoForm } from "./acoes";
import { supabaseNavegador } from "@/lib/supabase/client";
import type { Recurso } from "@/lib/planos";
import { MENSAGEM_CAPTURA_PADRAO } from "@/lib/regras";
import {
  ACEITOS,
  BUCKET_MIDIAS,
  LIMITE_ARQUIVO,
  LIMITE_IMAGEM,
  NOME_TIPO,
  limiteDoTipo,
  nomeSeguro,
  tamanhoLegivel,
  tipoDaMidia,
  type TipoMidia,
} from "@/lib/midia";

export type PostResumo = {
  id: string;
  legenda: string;
  miniatura: string | null;
  tipo: string;
  data: string;
};

export type Gatilho = "comentario" | "direct" | "story" | "live";

const GATILHOS: { id: Gatilho; rotulo: string; ajuda: string; rotuloPalavra: string }[] = [
  {
    id: "comentario",
    rotulo: "Comentário em post",
    ajuda: "Quem comentar a palavra-chave num post ou reels recebe uma resposta pública e o conteúdo no direct.",
    rotuloPalavra: "Quando alguém comentar",
  },
  {
    id: "direct",
    rotulo: "Mensagem no direct",
    ajuda: "Quem mandar a palavra-chave numa conversa no direct recebe o conteúdo.",
    rotuloPalavra: "Quando alguém mandar no direct",
  },
  {
    id: "story",
    rotulo: "Resposta a stories",
    ajuda: "Quem responder um dos seus stories com a palavra-chave recebe o conteúdo. No story, use algo como “Responda com a palavra X”.",
    rotuloPalavra: "Quando alguém responder um story com",
  },
  {
    id: "live",
    rotulo: "Comentário em live",
    ajuda: "Vale para qualquer live sua. Quem comentar a palavra-chave recebe o conteúdo no direct. Pela regra do Instagram, a mensagem só pode ser enviada enquanto a live estiver no ar.",
    rotuloPalavra: "Quando alguém comentar na live",
  },
];

export type ValoresAutomacao = {
  id?: string;
  nome: string;
  gatilho: Gatilho;
  post_id: string | null;
  palavra_chave: string;
  resposta_publica: string;
  resposta_publica_2: string;
  mensagem_dm: string;
  botao_dm: string;
  exige_seguir: boolean;
  mensagem_seguir: string;
  botao_seguir: string;
  captura_ativa: boolean;
  captura_tipo: "email" | "whatsapp";
  captura_mensagem: string;
  conteudo_tipo: "link" | "texto" | "midia";
  mensagem_entrega: string;
  conteudo_url: string;
  midia_path: string;
  midia_tipo: TipoMidia | "";
  midia_nome: string;
  midia_tamanho: number;
  midia_url: string;
  remarketing_ativo: boolean;
  remarketing_mensagem: string;
  remarketing_horas: number;
};

const campo = "w-full rounded-[10px] border border-campo bg-white px-3.5 text-[15px] text-tinta";
const rotulo = "text-sm font-semibold";
const ajuda = "text-[13px] text-suave";

function Secao({ titulo, children, destaque }: { titulo: React.ReactNode; children?: React.ReactNode; destaque?: boolean }) {
  return (
    <section className={`flex flex-col gap-3.5 rounded-[14px] bg-white p-6 ${destaque ? "border-2 border-marsala" : "border border-linha"}`}>
      {typeof titulo === "string" ? <h2 className="text-[17px] font-bold">{titulo}</h2> : titulo}
      {children}
    </section>
  );
}

function Pilula({
  ativo,
  onClick,
  children,
  desabilitado,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
  desabilitado?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      disabled={desabilitado}
      onClick={onClick}
      className={`h-11 rounded-full border px-[18px] text-sm disabled:cursor-not-allowed disabled:opacity-50 ${
        ativo ? "border-marsala bg-marsala font-semibold text-off" : "border-campo bg-white font-medium text-tinta"
      }`}
    >
      {children}
    </button>
  );
}

function Interruptor({ ligado, onClick, rotulo: nome }: { ligado: boolean; onClick: () => void; rotulo: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      aria-label={nome}
      onClick={onClick}
      className={`relative h-8 w-14 shrink-0 rounded-2xl transition ${ligado ? "bg-marsala" : "bg-[#8E8184]"}`}
    >
      <span className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-all ${ligado ? "left-7" : "left-1"}`} />
    </button>
  );
}

function TituloComInterruptor({
  titulo,
  descricao,
  ligado,
  onClick,
  bloqueado,
}: {
  titulo: string;
  descricao: string;
  ligado: boolean;
  onClick: () => void;
  bloqueado?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="flex flex-wrap items-center gap-2 text-[17px] font-bold">
          {titulo}
          {bloqueado && <SeloCompleto />}
        </h2>
        <p className="text-sm text-suave">{descricao}</p>
      </div>
      {!bloqueado && <Interruptor ligado={ligado} onClick={onClick} rotulo={titulo} />}
    </div>
  );
}

function SeloCompleto() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-[#F1E4E6] px-2 py-0.5 text-xs font-semibold text-marsala">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
      Plano Completo
    </span>
  );
}

function AvisoBloqueio({ texto }: { texto: string }) {
  return (
    <p className="rounded-lg bg-off-2 px-3 py-2.5 text-sm text-tinta-2">
      {texto}{" "}
      <a href="mailto:contatodesenhoads@gmail.com?subject=Upgrade%20Responde%20AI" className="font-semibold">
        Quero o plano Completo
      </a>
    </p>
  );
}

export function FormAutomacao({
  inicial,
  posts,
  erroPosts,
  username,
  recursos,
  clienteId,
}: {
  inicial: ValoresAutomacao;
  posts: PostResumo[];
  erroPosts: boolean;
  username: string | null;
  recursos: Recurso[];
  clienteId: string;
}) {
  const [estado, acao, enviando] = useActionState<EstadoForm, FormData>(salvarAutomacao, {});
  const [v, setV] = useState(inicial);
  const [enviandoArquivo, setEnviandoArquivo] = useState(false);
  const [erroArquivo, setErroArquivo] = useState<string | null>(null);
  const caminhoSalvo = useRef(inicial.midia_path); // arquivo que já está gravado na automação
  const muda = <K extends keyof ValoresAutomacao>(k: K, valor: ValoresAutomacao[K]) => setV((x) => ({ ...x, [k]: valor }));

  const podeCaptura = recursos.includes("captura_lead");
  const podeMidia = recursos.includes("midia");
  const podeRemarketing = recursos.includes("remarketing");

  const postEscolhido = posts.find((p) => p.id === v.post_id);
  const perfil = username ? `@${username}` : "o perfil";
  const gatilhoAtual = GATILHOS.find((g) => g.id === v.gatilho) ?? GATILHOS[0];
  const emPost = v.gatilho === "comentario";

  // Numeração das etapas conforme o gatilho escolhido.
  const etapas = ["palavra", "dm", "seguir", "captura", "conteudo", "remarketing"];
  if (emPost) etapas.unshift("post");
  if (emPost) etapas.splice(etapas.indexOf("dm"), 0, "publica");
  const n = (etapa: string) => etapas.indexOf(etapa) + 1;

  async function escolherArquivo(arquivo: File | undefined) {
    setErroArquivo(null);
    if (!arquivo) return;
    const tipo = tipoDaMidia(arquivo.type, arquivo.name);
    if (!tipo) {
      setErroArquivo("Tipo de arquivo não aceito. Use JPG, PNG, MP4, MOV, MP3, M4A, WAV ou PDF.");
      return;
    }
    if (arquivo.size > limiteDoTipo(tipo)) {
      setErroArquivo(`${NOME_TIPO[tipo]} grande demais (${tamanhoLegivel(arquivo.size)}). Limite: ${tamanhoLegivel(limiteDoTipo(tipo))}.`);
      return;
    }

    setEnviandoArquivo(true);
    const supabase = supabaseNavegador();
    const caminho = `${clienteId}/${crypto.randomUUID()}-${nomeSeguro(arquivo.name)}`;
    const { error } = await supabase.storage
      .from(BUCKET_MIDIAS)
      .upload(caminho, arquivo, { contentType: arquivo.type || undefined, upsert: false });
    setEnviandoArquivo(false);
    if (error) {
      setErroArquivo("Não foi possível enviar o arquivo. Tente de novo.");
      return;
    }

    // Arquivo enviado nesta edição e trocado de novo: apaga o anterior (o salvo é apagado ao salvar).
    if (v.midia_path && v.midia_path !== caminhoSalvo.current) {
      await supabase.storage.from(BUCKET_MIDIAS).remove([v.midia_path]);
    }
    const { data } = supabase.storage.from(BUCKET_MIDIAS).getPublicUrl(caminho);
    setV((x) => ({
      ...x,
      midia_path: caminho,
      midia_tipo: tipo,
      midia_nome: arquivo.name,
      midia_tamanho: arquivo.size,
      midia_url: data.publicUrl,
    }));
  }

  return (
    <form action={acao} className="flex flex-wrap items-start gap-6">
      <input type="hidden" name="id" value={v.id ?? ""} />
      <input type="hidden" name="gatilho" value={v.gatilho} />
      <input type="hidden" name="post_id" value={v.post_id ?? ""} />
      <input type="hidden" name="post_legenda" value={postEscolhido?.legenda ?? ""} />
      <input type="hidden" name="post_miniatura" value={postEscolhido?.miniatura ?? ""} />
      <input type="hidden" name="conteudo_tipo" value={v.conteudo_tipo} />
      <input type="hidden" name="captura_tipo" value={v.captura_tipo} />
      <input type="hidden" name="midia_path" value={v.midia_path} />
      <input type="hidden" name="midia_tipo" value={v.midia_tipo} />
      <input type="hidden" name="midia_nome" value={v.midia_nome} />
      <input type="hidden" name="midia_tamanho" value={String(v.midia_tamanho || "")} />
      {v.exige_seguir && <input type="hidden" name="exige_seguir" value="on" />}
      {v.captura_ativa && podeCaptura && <input type="hidden" name="captura_ativa" value="on" />}
      {v.remarketing_ativo && podeRemarketing && <input type="hidden" name="remarketing_ativo" value="on" />}

      <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-4">
        <Secao titulo="Nome e gatilho">
          <label htmlFor="nome" className={rotulo}>Nome da automação</label>
          <input id="nome" name="nome" required value={v.nome} onChange={(e) => muda("nome", e.target.value)} placeholder="Ex.: Prompt de roteiros" className={`${campo} h-[46px]`} />
          <span className={rotulo}>Quando acionar</span>
          <div className="flex flex-wrap gap-2">
            {GATILHOS.map((g) => (
              <Pilula key={g.id} ativo={v.gatilho === g.id} onClick={() => muda("gatilho", g.id)}>
                {g.rotulo}
              </Pilula>
            ))}
          </div>
          <p className={ajuda}>{gatilhoAtual.ajuda}</p>
        </Secao>

        {emPost && (
          <Secao titulo={`${n("post")}. Escolha o post`}>
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

        <Secao titulo={`${n("palavra")}. Palavra-chave`}>
          <label htmlFor="palavra_chave" className={rotulo}>
            {gatilhoAtual.rotuloPalavra}
          </label>
          <input id="palavra_chave" name="palavra_chave" required value={v.palavra_chave} onChange={(e) => muda("palavra_chave", e.target.value)} placeholder="prompt" className={`${campo} h-[46px]`} />
          <p className={ajuda}>Funciona com maiúsculas, minúsculas e acentos: “Prompt”, “PROMPT” e “prompt!” acionam igual.</p>
        </Secao>

        {emPost && (
          <Secao titulo={`${n("publica")}. Resposta pública ao comentário`}>
            <label htmlFor="resposta_publica" className={rotulo}>Resposta 1</label>
            <textarea id="resposta_publica" name="resposta_publica" rows={2} maxLength={300} value={v.resposta_publica} onChange={(e) => muda("resposta_publica", e.target.value)} className={`${campo} py-3`} />
            <label htmlFor="resposta_publica_2" className={rotulo}>Resposta 2 (opcional)</label>
            <textarea id="resposta_publica_2" name="resposta_publica_2" rows={2} maxLength={300} value={v.resposta_publica_2} onChange={(e) => muda("resposta_publica_2", e.target.value)} placeholder="Ex.: Corre lá no direct, já te enviei!" className={`${campo} py-3`} />
            <p className={ajuda}>Com duas respostas, o sistema alterna entre elas, para os comentários não ficarem todos iguais. Deixe as duas vazias para não responder em público.</p>
          </Secao>
        )}

        <Secao titulo={`${n("dm")}. Primeira mensagem no direct`}>
          <label htmlFor="mensagem_dm" className={rotulo}>Mensagem</label>
          <textarea id="mensagem_dm" name="mensagem_dm" required rows={2} maxLength={640} value={v.mensagem_dm} onChange={(e) => muda("mensagem_dm", e.target.value)} className={`${campo} py-3`} />
          <label htmlFor="botao_dm" className={rotulo}>Texto do botão</label>
          <input id="botao_dm" name="botao_dm" maxLength={20} value={v.botao_dm} onChange={(e) => muda("botao_dm", e.target.value)} className={`${campo} h-[46px]`} />
          <p className={ajuda}>Até 20 caracteres. O clique neste botão é o que permite conferir se a pessoa segue o perfil.</p>
        </Secao>

        <Secao
          destaque
          titulo={
            <TituloComInterruptor
              titulo={`${n("seguir")}. Exigir que siga o perfil`}
              descricao="Quem não segue recebe um convite antes do conteúdo."
              ligado={v.exige_seguir}
              onClick={() => muda("exige_seguir", !v.exige_seguir)}
            />
          }
        >
          {v.exige_seguir && (
            <div className="flex flex-col gap-3.5 border-t border-linha-2 pt-3.5">
              <label htmlFor="mensagem_seguir" className={rotulo}>Mensagem para quem ainda não segue</label>
              <textarea id="mensagem_seguir" name="mensagem_seguir" rows={2} maxLength={640} value={v.mensagem_seguir} onChange={(e) => muda("mensagem_seguir", e.target.value)} className={`${campo} py-3`} />
              <label htmlFor="botao_seguir" className={rotulo}>Texto do botão</label>
              <input id="botao_seguir" name="botao_seguir" maxLength={20} value={v.botao_seguir} onChange={(e) => muda("botao_seguir", e.target.value)} className={`${campo} h-[46px]`} />
            </div>
          )}
        </Secao>

        <Secao
          titulo={
            <TituloComInterruptor
              titulo={`${n("captura")}. Pedir e-mail ou WhatsApp`}
              descricao="Antes de entregar, a pessoa informa o contato. Ele fica salvo em Contatos."
              ligado={v.captura_ativa}
              onClick={() => muda("captura_ativa", !v.captura_ativa)}
              bloqueado={!podeCaptura}
            />
          }
        >
          {!podeCaptura && <AvisoBloqueio texto="Transforme cada comentário em um lead com e-mail ou WhatsApp." />}
          {podeCaptura && v.captura_ativa && (
            <div className="flex flex-col gap-3.5 border-t border-linha-2 pt-3.5">
              <span className={rotulo}>O que pedir</span>
              <div className="flex flex-wrap gap-2">
                <Pilula ativo={v.captura_tipo === "email"} onClick={() => setV((x) => ({ ...x, captura_tipo: "email", captura_mensagem: x.captura_mensagem === MENSAGEM_CAPTURA_PADRAO.whatsapp ? MENSAGEM_CAPTURA_PADRAO.email : x.captura_mensagem }))}>
                  E-mail
                </Pilula>
                <Pilula ativo={v.captura_tipo === "whatsapp"} onClick={() => setV((x) => ({ ...x, captura_tipo: "whatsapp", captura_mensagem: x.captura_mensagem === MENSAGEM_CAPTURA_PADRAO.email ? MENSAGEM_CAPTURA_PADRAO.whatsapp : x.captura_mensagem }))}>
                  WhatsApp
                </Pilula>
              </div>
              <label htmlFor="captura_mensagem" className={rotulo}>Mensagem do pedido</label>
              <textarea id="captura_mensagem" name="captura_mensagem" rows={2} maxLength={640} value={v.captura_mensagem} onChange={(e) => muda("captura_mensagem", e.target.value)} className={`${campo} py-3`} />
              <p className={ajuda}>O sistema confere se o {v.captura_tipo === "email" ? "e-mail" : "número"} é válido e pede de novo se não for. Quem já informou antes recebe direto.</p>
            </div>
          )}
        </Secao>

        <Secao titulo={`${n("conteudo")}. Conteúdo a entregar`}>
          <div className="flex flex-wrap gap-2">
            <Pilula ativo={v.conteudo_tipo === "link"} onClick={() => muda("conteudo_tipo", "link")}>Link</Pilula>
            <Pilula ativo={v.conteudo_tipo === "texto"} onClick={() => muda("conteudo_tipo", "texto")}>Texto</Pilula>
            <Pilula ativo={v.conteudo_tipo === "midia"} onClick={() => muda("conteudo_tipo", "midia")} desabilitado={!podeMidia}>
              Arquivo (imagem, vídeo, áudio ou PDF)
            </Pilula>
          </div>
          {!podeMidia && <AvisoBloqueio texto="Envie imagem, vídeo, áudio ou PDF direto no direct." />}

          <label htmlFor="mensagem_entrega" className={rotulo}>Mensagem de entrega</label>
          <textarea id="mensagem_entrega" name="mensagem_entrega" required rows={v.conteudo_tipo === "texto" ? 5 : 2} maxLength={900} value={v.mensagem_entrega} onChange={(e) => muda("mensagem_entrega", e.target.value)} className={`${campo} py-3`} />

          {v.conteudo_tipo === "link" && (
            <>
              <label htmlFor="conteudo_url" className={rotulo}>Link</label>
              <input id="conteudo_url" name="conteudo_url" type="url" value={v.conteudo_url} onChange={(e) => muda("conteudo_url", e.target.value)} placeholder="https://" className={`${campo} h-[46px]`} />
              <p className={ajuda}>O link vai num endereço do Responde AI para contar os cliques no dashboard.</p>
            </>
          )}

          {v.conteudo_tipo === "midia" && podeMidia && (
            <div className="flex flex-col gap-3 rounded-xl border border-dashed border-campo bg-off-2 p-4">
              {v.midia_path ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-[15px] font-semibold">{v.midia_nome || "Arquivo enviado"}</span>
                    <span className="text-[13px] text-suave">
                      {v.midia_tipo ? NOME_TIPO[v.midia_tipo] : "Arquivo"} · {tamanhoLegivel(v.midia_tamanho || 0)}
                    </span>
                  </div>
                  <label className="flex h-11 cursor-pointer items-center rounded-[10px] border border-campo bg-white px-4 text-sm font-semibold">
                    Trocar arquivo
                    <input type="file" accept={ACEITOS} className="sr-only" onChange={(e) => escolherArquivo(e.target.files?.[0])} />
                  </label>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center gap-1.5 py-4 text-center">
                  <span className="flex h-11 items-center rounded-[10px] bg-marsala px-5 text-sm font-semibold text-off">
                    {enviandoArquivo ? "Enviando…" : "Escolher arquivo"}
                  </span>
                  <input type="file" accept={ACEITOS} className="sr-only" disabled={enviandoArquivo} onChange={(e) => escolherArquivo(e.target.files?.[0])} />
                </label>
              )}
              {enviandoArquivo && v.midia_path && <p className="text-sm text-suave">Enviando o novo arquivo…</p>}
              <p className={ajuda}>
                Imagem (JPG ou PNG) até {tamanhoLegivel(LIMITE_IMAGEM)} · Vídeo, áudio ou PDF até {tamanhoLegivel(LIMITE_ARQUIVO)}. A mensagem de entrega chega primeiro e o arquivo logo em seguida.
              </p>
              {erroArquivo && <p role="alert" className="rounded-lg bg-erro-fundo px-3 py-2 text-sm text-erro">{erroArquivo}</p>}
            </div>
          )}
        </Secao>

        <Secao
          titulo={
            <TituloComInterruptor
              titulo={`${n("remarketing")}. Remarketing`}
              descricao="Uma mensagem algumas horas depois da entrega, para puxar conversa."
              ligado={v.remarketing_ativo}
              onClick={() => muda("remarketing_ativo", !v.remarketing_ativo)}
              bloqueado={!podeRemarketing}
            />
          }
        >
          {!podeRemarketing && <AvisoBloqueio texto="Volte a falar com quem recebeu o conteúdo e transforme a entrega em conversa." />}
          {podeRemarketing && v.remarketing_ativo && (
            <div className="flex flex-col gap-3.5 border-t border-linha-2 pt-3.5">
              <label htmlFor="remarketing_mensagem" className={rotulo}>Mensagem</label>
              <textarea id="remarketing_mensagem" name="remarketing_mensagem" rows={2} maxLength={640} value={v.remarketing_mensagem} onChange={(e) => muda("remarketing_mensagem", e.target.value)} className={`${campo} py-3`} />
              <label htmlFor="remarketing_horas" className={rotulo}>Enviar quanto tempo depois da entrega</label>
              <select id="remarketing_horas" name="remarketing_horas" value={v.remarketing_horas} onChange={(e) => muda("remarketing_horas", Number(e.target.value))} className={`${campo} h-[46px]`}>
                {Array.from({ length: 23 }, (_, i) => i + 1).map((h) => (
                  <option key={h} value={h}>
                    {h} {h === 1 ? "hora" : "horas"}
                  </option>
                ))}
              </select>
              <p className={ajuda}>Pela regra do Instagram, só dá para mandar até 24 horas depois da última interação da pessoa, por isso o máximo é 23 horas. Se ela responder, a conversa continua no seu direct.</p>
            </div>
          )}
        </Secao>

        {estado.erro && <p role="alert" className="rounded-xl bg-erro-fundo px-4 py-3 text-sm text-erro">{estado.erro}</p>}

        <div className="flex flex-wrap justify-end gap-3">
          <Link href="/automacoes" className="flex h-12 items-center px-3 text-[15px] font-semibold">Cancelar</Link>
          <button type="submit" name="acao" value="rascunho" disabled={enviando || enviandoArquivo} className="h-12 rounded-[10px] border border-campo bg-white px-[22px] text-[15px] font-semibold text-tinta disabled:opacity-60">
            Salvar rascunho
          </button>
          <button type="submit" name="acao" value="ativar" disabled={enviando || enviandoArquivo} className="h-12 rounded-[10px] bg-marsala px-[22px] text-[15px] font-semibold text-off hover:bg-marsala-escuro disabled:opacity-60">
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
            <Rotulo>se a pessoa ainda não segue</Rotulo>
            <Balao>{v.mensagem_seguir || "Mensagem para quem não segue…"}</Balao>
            <BotaoPrevia>{v.botao_seguir || "Já segui"}</BotaoPrevia>
          </>
        )}
        {podeCaptura && v.captura_ativa && (
          <>
            <Rotulo>pedido de contato</Rotulo>
            <Balao>{v.captura_mensagem || MENSAGEM_CAPTURA_PADRAO[v.captura_tipo]}</Balao>
            <div className="max-w-[70%] self-end rounded-2xl rounded-br bg-[#EDE7F6] px-3.5 py-2.5 text-sm text-tinta-2">
              {v.captura_tipo === "email" ? "nome@email.com" : "47 99999-9999"}
            </div>
          </>
        )}
        <Rotulo>entrega</Rotulo>
        <div className="max-w-[86%] self-start whitespace-pre-line rounded-2xl rounded-bl bg-marsala px-3.5 py-3 text-sm leading-normal text-off">
          {v.mensagem_entrega || "Mensagem de entrega…"}
          {v.conteudo_tipo === "link" && v.conteudo_url && <span className="mt-1 block underline">link do conteúdo</span>}
        </div>
        {v.conteudo_tipo === "midia" && v.midia_path && (
          <div className="flex max-w-[86%] items-center gap-2 self-start rounded-2xl rounded-bl border border-linha bg-off-2 px-3.5 py-3 text-sm">
            <span className="rounded bg-marsala px-1.5 py-0.5 text-xs font-semibold text-off">{v.midia_tipo ? NOME_TIPO[v.midia_tipo] : "Arquivo"}</span>
            <span className="truncate">{v.midia_nome}</span>
          </div>
        )}
        {podeRemarketing && v.remarketing_ativo && (
          <>
            <Rotulo>{v.remarketing_horas} {v.remarketing_horas === 1 ? "hora" : "horas"} depois</Rotulo>
            <Balao>{v.remarketing_mensagem || "Mensagem de remarketing…"}</Balao>
          </>
        )}
      </aside>
    </form>
  );
}

function Rotulo({ children }: { children: React.ReactNode }) {
  return <span className="self-center text-xs text-suave">{children}</span>;
}

function Balao({ children }: { children: React.ReactNode }) {
  return <div className="max-w-[86%] self-start whitespace-pre-line rounded-2xl rounded-bl bg-off px-3.5 py-3 text-sm leading-normal">{children}</div>;
}

function BotaoPrevia({ children }: { children: React.ReactNode }) {
  return <div className="self-start rounded-[10px] border border-marsala px-3.5 py-2 text-sm font-semibold text-marsala">{children}</div>;
}
