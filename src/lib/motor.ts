import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { descriptografar } from "@/lib/cripto";
import { env } from "@/lib/env";
import {
  enviarMensagem,
  mensagemComBotoes,
  perfilDoContato,
  respostaPrivada,
  responderComentarioPublico,
} from "@/lib/instagram";

// =====================================================================
// Motor das automações
// Fluxo: comentário → resposta pública → DM com botão → (verifica se segue)
//        → pede para seguir + "Já segui" → entrega o conteúdo
// =====================================================================

type Conta = { cliente_id: string; ig_user_id: string; token: string };

type Automacao = {
  id: string;
  cliente_id: string;
  nome: string;
  gatilho: "comentario" | "direct" | "story" | "live";
  post_id: string | null;
  palavra_chave: string;
  resposta_publica: string | null;
  mensagem_dm: string;
  botao_dm: string;
  exige_seguir: boolean;
  mensagem_seguir: string | null;
  botao_seguir: string;
  conteudo_tipo: "link" | "texto" | "arquivo";
  mensagem_entrega: string;
  conteudo_url: string | null;
};

const PAYLOAD_QUERO = "RAI:Q:";
const PAYLOAD_SEGUI = "RAI:S:";

// ---------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------

export function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// A palavra-chave precisa aparecer como palavra inteira:
// "prompt" casa com "Quero o PROMPT!", mas não com "prompts".
export function casaPalavra(texto: string, palavra: string) {
  const t = ` ${normalizar(texto)} `;
  const p = normalizar(palavra);
  return p.length > 0 && t.includes(` ${p} `);
}

export async function contaPorIgUserId(igUserId: string): Promise<Conta | null> {
  const { data } = await supabaseAdmin()
    .from("contas_instagram")
    .select("cliente_id, ig_user_id, token_criptografado, status, clientes(status)")
    .eq("ig_user_id", igUserId)
    .maybeSingle();
  if (!data?.token_criptografado || data.status !== "conectada") return null;

  // Bloqueio automático: cliente pausado ou cancelado não tem automações rodando.
  const cliente = Array.isArray(data.clientes) ? data.clientes[0] : data.clientes;
  if (cliente && (cliente as { status?: string }).status !== "ativo") return null;
  return {
    cliente_id: data.cliente_id,
    ig_user_id: data.ig_user_id,
    token: descriptografar(data.token_criptografado),
  };
}

async function automacoesAtivas(clienteId: string): Promise<Automacao[]> {
  const { data } = await supabaseAdmin()
    .from("automacoes")
    .select("*")
    .eq("cliente_id", clienteId)
    .eq("status", "ativa")
    .order("criado_em", { ascending: false });
  return (data ?? []) as Automacao[];
}

async function automacaoPorId(clienteId: string, id: string): Promise<Automacao | null> {
  const { data } = await supabaseAdmin()
    .from("automacoes")
    .select("*")
    .eq("cliente_id", clienteId)
    .eq("id", id)
    .maybeSingle();
  return (data as Automacao) ?? null;
}

async function salvarContato(clienteId: string, igsid: string, extra: { username?: string; segue?: boolean } = {}) {
  const { data } = await supabaseAdmin()
    .from("contatos")
    .upsert(
      {
        cliente_id: clienteId,
        igsid,
        ultima_interacao: new Date().toISOString(),
        ...(extra.username ? { username: extra.username } : {}),
        ...(extra.segue !== undefined ? { segue: extra.segue } : {}),
      },
      { onConflict: "cliente_id,igsid" },
    )
    .select("id")
    .single();
  return data?.id as string | undefined;
}

async function registrar(
  clienteId: string,
  tipo: string,
  automacaoId: string | null,
  contatoId: string | undefined,
  detalhe?: Record<string, unknown>,
) {
  await supabaseAdmin().from("eventos").insert({
    cliente_id: clienteId,
    automacao_id: automacaoId,
    contato_id: contatoId ?? null,
    tipo,
    detalhe: detalhe ?? null,
  });
}

function textoErro(e: unknown) {
  if (e && typeof e === "object" && "detalhe" in e) return JSON.stringify((e as { detalhe: unknown }).detalhe);
  return e instanceof Error ? e.message : String(e);
}

// ---------------------------------------------------------------------
// 1. Comentário recebido
// ---------------------------------------------------------------------

export type Comentario = {
  id?: string;
  comment_id?: string; // alguns avisos (ex.: live) usam este nome
  text?: string;
  from?: { id: string; username?: string };
  media?: { id: string; media_product_type?: string };
};

// origem "comentario" = post/reels; "live" = comentário durante uma live.
export async function processarComentario(conta: Conta, c: Comentario, origem: "comentario" | "live" = "comentario") {
  const comentarioId = c.id ?? c.comment_id;
  if (!comentarioId || !c.text || !c.from?.id) return;
  if (c.from.id === conta.ig_user_id) return; // resposta da própria conta

  const admin = supabaseAdmin();

  // A Meta pode reenviar o mesmo aviso: processa cada comentário uma vez.
  const { count } = await admin
    .from("eventos")
    .select("id", { count: "exact", head: true })
    .eq("cliente_id", conta.cliente_id)
    .eq("tipo", "comentou")
    .eq("detalhe->>comentario_id", comentarioId);
  if ((count ?? 0) > 0) return;

  const lista = await automacoesAtivas(conta.cliente_id);
  const auto = lista.find(
    (a) =>
      a.gatilho === origem &&
      (origem === "live" || !a.post_id || a.post_id === c.media?.id) &&
      casaPalavra(c.text!, a.palavra_chave),
  );
  if (!auto) return;

  const contatoId = await salvarContato(conta.cliente_id, c.from.id, { username: c.from.username });
  await registrar(conta.cliente_id, "comentou", auto.id, contatoId, {
    origem,
    comentario_id: comentarioId,
    texto: c.text.slice(0, 300),
    post_id: c.media?.id,
  });

  // Na live não há resposta pública: só a mensagem no direct.
  if (origem === "comentario" && auto.resposta_publica) {
    try {
      await responderComentarioPublico(conta.token, comentarioId, auto.resposta_publica);
    } catch (e) {
      await registrar(conta.cliente_id, "erro", auto.id, contatoId, { etapa: "resposta_publica", erro: textoErro(e) });
    }
  }

  // Primeira mensagem no direct, com o botão. Se o Instagram não aceitar o
  // botão nesta mensagem, manda só texto pedindo para responder com a palavra.
  // Na live, a Meta só permite enviar enquanto a transmissão estiver no ar.
  try {
    await respostaPrivada(
      conta.token,
      comentarioId,
      mensagemComBotoes(auto.mensagem_dm, [{ titulo: auto.botao_dm, payload: PAYLOAD_QUERO + auto.id }]),
    );
  } catch (e) {
    try {
      await respostaPrivada(conta.token, comentarioId, {
        text: `${auto.mensagem_dm}\n\nResponda esta mensagem com “${auto.palavra_chave}” para receber.`,
      });
    } catch (e2) {
      await registrar(conta.cliente_id, "erro", auto.id, contatoId, {
        etapa: "resposta_privada",
        erro: textoErro(e2),
        erro_botao: textoErro(e),
      });
    }
  }
}

// ---------------------------------------------------------------------
// 2. Mensagem ou clique em botão no direct
// ---------------------------------------------------------------------

export type EventoMensagem = {
  sender: { id: string };
  recipient: { id: string };
  message?: {
    mid?: string;
    text?: string;
    is_echo?: boolean;
    quick_reply?: { payload?: string };
    reply_to?: { mid?: string; story?: { id?: string; url?: string } };
  };
  postback?: { mid?: string; title?: string; payload?: string };
};

export async function processarMensagem(conta: Conta, ev: EventoMensagem) {
  if (ev.message?.is_echo) return; // mensagem enviada pela própria conta
  const igsid = ev.sender.id;
  if (!igsid || igsid === conta.ig_user_id) return;

  const payload = ev.postback?.payload ?? ev.message?.quick_reply?.payload ?? "";

  if (payload.startsWith(PAYLOAD_QUERO)) {
    const auto = await automacaoPorId(conta.cliente_id, payload.slice(PAYLOAD_QUERO.length));
    if (auto) await aoClicarQuero(conta, auto, igsid);
    return;
  }

  if (payload.startsWith(PAYLOAD_SEGUI)) {
    const auto = await automacaoPorId(conta.cliente_id, payload.slice(PAYLOAD_SEGUI.length));
    if (auto) await aoClicarJaSegui(conta, auto, igsid);
    return;
  }

  const texto = ev.message?.text;
  if (!texto) return;

  const lista = await automacoesAtivas(conta.cliente_id);
  const respostaDeStory = Boolean(ev.message?.reply_to?.story);

  // Resposta a story tem prioridade; se nenhuma automação de story casar,
  // a mensagem ainda pode acionar uma automação de direct.
  const doStory = respostaDeStory
    ? lista.find((a) => a.gatilho === "story" && casaPalavra(texto, a.palavra_chave))
    : undefined;
  const doDirect = doStory ?? lista.find((a) => a.gatilho === "direct" && casaPalavra(texto, a.palavra_chave));

  if (doDirect) {
    const contatoId = await salvarContato(conta.cliente_id, igsid);
    await registrar(conta.cliente_id, "comentou", doDirect.id, contatoId, {
      origem: doStory ? "story" : "direct",
      texto: texto.slice(0, 300),
      ...(doStory ? { story_id: ev.message?.reply_to?.story?.id } : {}),
    });
    try {
      await enviarMensagem(
        conta.token,
        igsid,
        mensagemComBotoes(doDirect.mensagem_dm, [{ titulo: doDirect.botao_dm, payload: PAYLOAD_QUERO + doDirect.id }]),
      );
    } catch {
      // Sem botão: a própria mensagem já deu o consentimento, segue direto.
      await aoClicarQuero(conta, doDirect, igsid);
    }
    return;
  }

  // Resposta com a palavra a uma automação de comentário (caso sem botão).
  const doComentario = lista.find(
    (a) => (a.gatilho === "comentario" || a.gatilho === "live") && casaPalavra(texto, a.palavra_chave),
  );
  if (doComentario) await aoClicarQuero(conta, doComentario, igsid);
}

async function aoClicarQuero(conta: Conta, auto: Automacao, igsid: string) {
  let contatoId = await salvarContato(conta.cliente_id, igsid);
  await registrar(conta.cliente_id, "clicou_botao", auto.id, contatoId);

  if (!auto.exige_seguir) {
    await entregar(conta, auto, igsid, contatoId);
    return;
  }

  try {
    const perfil = await perfilDoContato(conta.token, igsid);
    contatoId = await salvarContato(conta.cliente_id, igsid, perfil);
    if (perfil.segue) {
      await registrar(conta.cliente_id, "ja_seguia", auto.id, contatoId);
      await entregar(conta, auto, igsid, contatoId);
    } else {
      await registrar(conta.cliente_id, "pediu_seguir", auto.id, contatoId);
      await pedirParaSeguir(conta, auto, igsid);
    }
  } catch (e) {
    await registrar(conta.cliente_id, "erro", auto.id, contatoId, { etapa: "verificar_seguidor", erro: textoErro(e) });
  }
}

async function aoClicarJaSegui(conta: Conta, auto: Automacao, igsid: string) {
  let contatoId = await salvarContato(conta.cliente_id, igsid);
  try {
    const perfil = await perfilDoContato(conta.token, igsid);
    contatoId = await salvarContato(conta.cliente_id, igsid, perfil);
    if (perfil.segue) {
      await registrar(conta.cliente_id, "seguiu", auto.id, contatoId);
      await entregar(conta, auto, igsid, contatoId);
    } else {
      await enviarMensagem(
        conta.token,
        igsid,
        mensagemComBotoes(
          "Ainda não encontrei o seu follow por aqui. Siga o perfil e clique de novo no botão abaixo.",
          [{ titulo: auto.botao_seguir, payload: PAYLOAD_SEGUI + auto.id }],
        ),
      );
    }
  } catch (e) {
    await registrar(conta.cliente_id, "erro", auto.id, contatoId, { etapa: "ja_segui", erro: textoErro(e) });
  }
}

async function pedirParaSeguir(conta: Conta, auto: Automacao, igsid: string) {
  const texto =
    auto.mensagem_seguir ||
    "Quase lá! Para receber, siga o nosso perfil e depois clique em “Já segui”.";
  await enviarMensagem(
    conta.token,
    igsid,
    mensagemComBotoes(texto, [{ titulo: auto.botao_seguir, payload: PAYLOAD_SEGUI + auto.id }]),
  );
}

async function entregar(conta: Conta, auto: Automacao, igsid: string, contatoId: string | undefined) {
  let texto = auto.mensagem_entrega;
  if (auto.conteudo_url && auto.conteudo_tipo !== "texto") {
    // Link rastreável: conta os cliques no dashboard e redireciona.
    const link = `${env.siteUrl()}/l/${auto.id}${contatoId ? `?c=${contatoId}` : ""}`;
    texto = `${texto}\n\n${link}`;
  }
  try {
    await enviarMensagem(conta.token, igsid, { text: texto.slice(0, 1000) });
    await registrar(conta.cliente_id, "entregou", auto.id, contatoId);
  } catch (e) {
    await registrar(conta.cliente_id, "erro", auto.id, contatoId, { etapa: "entrega", erro: textoErro(e) });
  }
}
