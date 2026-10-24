import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { descriptografar } from "@/lib/cripto";
import { env } from "@/lib/env";
import { temRecurso } from "@/lib/planos";
import {
  enviarMensagem,
  mensagemComBotoes,
  perfilDoContato,
  respostaPrivada,
  responderComentarioPublico,
} from "@/lib/instagram";
import {
  escolherResposta,
  normalizarWhatsapp,
  validarEmail,
  casaPalavra,
  MENSAGEM_CAPTURA_PADRAO,
} from "@/lib/regras";

export { casaPalavra, normalizar } from "@/lib/regras";

// =====================================================================
// Motor das automações
// Fluxo: comentário → resposta pública → DM com botão → (verifica se segue)
//        → pede para seguir + "Já segui" → (pede e-mail/WhatsApp)
//        → entrega o conteúdo (texto, link ou mídia) → (remarketing)
// =====================================================================

export type Conta = { cliente_id: string; ig_user_id: string; token: string; plano: string };

type Automacao = {
  id: string;
  cliente_id: string;
  nome: string;
  gatilho: "comentario" | "direct" | "story" | "live";
  post_id: string | null;
  palavra_chave: string;
  resposta_publica: string | null;
  resposta_publica_2: string | null;
  mensagem_dm: string;
  botao_dm: string;
  exige_seguir: boolean;
  mensagem_seguir: string | null;
  botao_seguir: string;
  captura_ativa: boolean;
  captura_tipo: "email" | "whatsapp";
  captura_mensagem: string | null;
  conteudo_tipo: "link" | "texto" | "arquivo" | "midia";
  mensagem_entrega: string;
  conteudo_url: string | null;
  midia_url: string | null;
  midia_tipo: "image" | "video" | "audio" | "file" | null;
  remarketing_ativo: boolean;
  remarketing_mensagem: string | null;
  remarketing_horas: number;
};

const PAYLOAD_QUERO = "RAI:Q:";
const PAYLOAD_SEGUI = "RAI:S:";
const HORA = 60 * 60 * 1000;

// ---------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------

function contaDeLinha(data: {
  cliente_id: string;
  ig_user_id: string;
  token_criptografado: string | null;
  status: string;
  clientes: unknown;
}): Conta | null {
  if (!data.token_criptografado || data.status !== "conectada") return null;
  // Bloqueio automático: cliente pausado ou cancelado não tem automações rodando.
  const cliente = (Array.isArray(data.clientes) ? data.clientes[0] : data.clientes) as
    | { status?: string; plano?: string }
    | null;
  if (cliente && cliente.status !== "ativo") return null;
  return {
    cliente_id: data.cliente_id,
    ig_user_id: data.ig_user_id,
    token: descriptografar(data.token_criptografado),
    plano: cliente?.plano ?? "essencial",
  };
}

const CAMPOS_CONTA = "cliente_id, ig_user_id, token_criptografado, status, clientes(status, plano)";

export async function contaPorIgUserId(igUserId: string): Promise<Conta | null> {
  const { data } = await supabaseAdmin().from("contas_instagram").select(CAMPOS_CONTA).eq("ig_user_id", igUserId).maybeSingle();
  return data ? contaDeLinha(data) : null;
}

export async function contaPorCliente(clienteId: string): Promise<Conta | null> {
  const { data } = await supabaseAdmin().from("contas_instagram").select(CAMPOS_CONTA).eq("cliente_id", clienteId).maybeSingle();
  return data ? contaDeLinha(data) : null;
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

async function salvarContato(clienteId: string, igsid: string, extra: Record<string, unknown> = {}) {
  const limpo = Object.fromEntries(Object.entries(extra).filter(([, v]) => v !== undefined));
  const { data } = await supabaseAdmin()
    .from("contatos")
    .upsert(
      { cliente_id: clienteId, igsid, ultima_interacao: new Date().toISOString(), ...limpo },
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

  // Resposta pública (alterna entre as variações). Na live não há resposta pública.
  const resposta = escolherResposta([auto.resposta_publica, auto.resposta_publica_2]);
  if (origem === "comentario" && resposta) {
    try {
      await responderComentarioPublico(conta.token, comentarioId, resposta);
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

  // Pessoa estava respondendo o pedido de e-mail/WhatsApp?
  if (await tratarRespostaDeCaptura(conta, igsid, texto)) return;

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
    await seguirParaEntrega(conta, auto, igsid, contatoId);
    return;
  }

  try {
    const perfil = await perfilDoContato(conta.token, igsid);
    contatoId = await salvarContato(conta.cliente_id, igsid, perfil);
    if (perfil.segue) {
      await registrar(conta.cliente_id, "ja_seguia", auto.id, contatoId);
      await seguirParaEntrega(conta, auto, igsid, contatoId);
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
      await seguirParaEntrega(conta, auto, igsid, contatoId);
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

// ---------------------------------------------------------------------
// 3. Captura de e-mail ou WhatsApp (plano Completo)
// ---------------------------------------------------------------------

async function seguirParaEntrega(conta: Conta, auto: Automacao, igsid: string, contatoId: string | undefined) {
  if (!auto.captura_ativa || !temRecurso(conta.plano, "captura_lead")) {
    await entregar(conta, auto, igsid, contatoId);
    return;
  }

  // Quem já deixou o dado antes não precisa informar de novo.
  const { data: contato } = await supabaseAdmin()
    .from("contatos")
    .select("email, whatsapp")
    .eq("cliente_id", conta.cliente_id)
    .eq("igsid", igsid)
    .maybeSingle();
  if ((auto.captura_tipo === "email" && contato?.email) || (auto.captura_tipo === "whatsapp" && contato?.whatsapp)) {
    await entregar(conta, auto, igsid, contatoId);
    return;
  }

  await salvarContato(conta.cliente_id, igsid, {
    aguardando_automacao_id: auto.id,
    aguardando_desde: new Date().toISOString(),
  });
  try {
    await enviarMensagem(conta.token, igsid, {
      text: (auto.captura_mensagem || MENSAGEM_CAPTURA_PADRAO[auto.captura_tipo]).slice(0, 1000),
    });
  } catch (e) {
    await registrar(conta.cliente_id, "erro", auto.id, contatoId, { etapa: "captura_pedido", erro: textoErro(e) });
  }
}

// Retorna true se a mensagem era a resposta ao pedido de e-mail/WhatsApp.
async function tratarRespostaDeCaptura(conta: Conta, igsid: string, texto: string): Promise<boolean> {
  const admin = supabaseAdmin();
  const { data: contato } = await admin
    .from("contatos")
    .select("id, aguardando_automacao_id, aguardando_desde")
    .eq("cliente_id", conta.cliente_id)
    .eq("igsid", igsid)
    .maybeSingle();
  if (!contato?.aguardando_automacao_id || !contato.aguardando_desde) return false;

  // Fora da janela de 24 h, esquece o pedido.
  if (Date.now() - new Date(contato.aguardando_desde).getTime() > 24 * HORA) {
    await admin.from("contatos").update({ aguardando_automacao_id: null, aguardando_desde: null }).eq("id", contato.id);
    return false;
  }

  const auto = await automacaoPorId(conta.cliente_id, contato.aguardando_automacao_id);
  if (!auto) {
    await admin.from("contatos").update({ aguardando_automacao_id: null, aguardando_desde: null }).eq("id", contato.id);
    return false;
  }

  const valor = auto.captura_tipo === "email" ? validarEmail(texto) : normalizarWhatsapp(texto);
  if (!valor) {
    const pedido =
      auto.captura_tipo === "email"
        ? "Hmm, não parece um e-mail válido. Pode mandar de novo? Ex.: nome@email.com"
        : "Hmm, não parece um número válido. Pode mandar de novo com DDD? Ex.: 47 99999-9999";
    try {
      await enviarMensagem(conta.token, igsid, { text: pedido });
    } catch {
      // segue esperando
    }
    return true;
  }

  await admin
    .from("contatos")
    .update({
      [auto.captura_tipo]: valor,
      aguardando_automacao_id: null,
      aguardando_desde: null,
      ultima_interacao: new Date().toISOString(),
    })
    .eq("id", contato.id);
  await registrar(conta.cliente_id, "capturou_lead", auto.id, contato.id, { tipo: auto.captura_tipo });
  await entregar(conta, auto, igsid, contato.id);
  return true;
}

// ---------------------------------------------------------------------
// 4. Entrega (texto, link ou mídia) e agendamento do remarketing
// ---------------------------------------------------------------------

async function entregar(conta: Conta, auto: Automacao, igsid: string, contatoId: string | undefined) {
  const linkRastreavel = `${env.siteUrl()}/l/${auto.id}${contatoId ? `?c=${contatoId}` : ""}`;
  const comMidia = auto.conteudo_tipo === "midia" && auto.midia_url && auto.midia_tipo;
  const midiaLiberada = comMidia && temRecurso(conta.plano, "midia");

  let texto = auto.mensagem_entrega;
  if (auto.conteudo_url && (auto.conteudo_tipo === "link" || auto.conteudo_tipo === "arquivo")) {
    // Link rastreável: conta os cliques no dashboard e redireciona.
    texto = `${texto}\n\n${linkRastreavel}`;
  }
  // Plano sem mídia (ex.: fez downgrade): a pessoa ainda recebe o arquivo como link.
  if (comMidia && !midiaLiberada) texto = `${texto}\n\n${auto.midia_url}`;

  try {
    await enviarMensagem(conta.token, igsid, { text: texto.slice(0, 1000) });
    if (midiaLiberada) await enviarMidia(conta, auto, igsid);
    await registrar(conta.cliente_id, "entregou", auto.id, contatoId);
  } catch (e) {
    await registrar(conta.cliente_id, "erro", auto.id, contatoId, { etapa: "entrega", erro: textoErro(e) });
    return;
  }

  await agendarRemarketing(conta, auto, igsid, contatoId);
}

async function enviarMidia(conta: Conta, auto: Automacao, igsid: string) {
  const anexo = { type: auto.midia_tipo, payload: { url: auto.midia_url } };
  try {
    await enviarMensagem(conta.token, igsid, { attachment: anexo });
  } catch (e) {
    // Formato alternativo documentado para imagens.
    if (auto.midia_tipo === "image") {
      try {
        await enviarMensagem(conta.token, igsid, { attachments: anexo });
        return;
      } catch {
        // cai no link abaixo
      }
    }
    // Último recurso: manda o arquivo como link, para a pessoa não ficar sem.
    await enviarMensagem(conta.token, igsid, { text: `Seu arquivo: ${auto.midia_url}` });
    await registrar(conta.cliente_id, "erro", auto.id, undefined, { etapa: "entrega_midia", erro: textoErro(e) });
  }
}

async function agendarRemarketing(conta: Conta, auto: Automacao, igsid: string, contatoId: string | undefined) {
  if (!auto.remarketing_ativo || !auto.remarketing_mensagem || !temRecurso(conta.plano, "remarketing")) return;
  const admin = supabaseAdmin();

  // Um remarketing por pessoa por automação, enquanto houver um pendente.
  if (contatoId) {
    const { count } = await admin
      .from("envios_agendados")
      .select("id", { count: "exact", head: true })
      .eq("automacao_id", auto.id)
      .eq("contato_id", contatoId)
      .eq("status", "pendente");
    if ((count ?? 0) > 0) return;
  }

  const horas = Math.min(23, Math.max(1, auto.remarketing_horas || 2));
  const agora = Date.now();
  await admin.from("envios_agendados").insert({
    cliente_id: conta.cliente_id,
    automacao_id: auto.id,
    contato_id: contatoId ?? null,
    igsid,
    mensagem: auto.remarketing_mensagem,
    enviar_em: new Date(agora + horas * HORA).toISOString(),
    janela_ate: new Date(agora + 24 * HORA - 5 * 60 * 1000).toISOString(),
  });
}

// ---------------------------------------------------------------------
// 5. Envio dos remarketings vencidos (chamado pelo agendador)
// ---------------------------------------------------------------------

export async function enviarRemarketingsPendentes(limite = 50) {
  const admin = supabaseAdmin();
  const agora = new Date().toISOString();
  const { data: lista } = await admin
    .from("envios_agendados")
    .select("id, cliente_id, automacao_id, contato_id, igsid, mensagem, janela_ate")
    .eq("status", "pendente")
    .lte("enviar_em", agora)
    .order("enviar_em", { ascending: true })
    .limit(limite);

  const resultado = { enviados: 0, expirados: 0, cancelados: 0, erros: 0 };
  const contas = new Map<string, Conta | null>();

  for (const envio of lista ?? []) {
    // Marca antes de enviar, para duas execuções nunca mandarem a mesma mensagem.
    const { data: pego } = await admin
      .from("envios_agendados")
      .update({ status: "enviado", enviado_em: new Date().toISOString() })
      .eq("id", envio.id)
      .eq("status", "pendente")
      .select("id")
      .maybeSingle();
    if (!pego) continue;

    if (new Date(envio.janela_ate).getTime() < Date.now()) {
      await admin.from("envios_agendados").update({ status: "expirado" }).eq("id", envio.id);
      resultado.expirados++;
      continue;
    }

    if (!contas.has(envio.cliente_id)) contas.set(envio.cliente_id, await contaPorCliente(envio.cliente_id));
    const conta = contas.get(envio.cliente_id);
    if (!conta || !temRecurso(conta.plano, "remarketing")) {
      await admin.from("envios_agendados").update({ status: "cancelado" }).eq("id", envio.id);
      resultado.cancelados++;
      continue;
    }

    try {
      await enviarMensagem(conta.token, envio.igsid, { text: String(envio.mensagem).slice(0, 1000) });
      await registrar(conta.cliente_id, "remarketing", envio.automacao_id, envio.contato_id ?? undefined);
      resultado.enviados++;
    } catch (e) {
      await admin
        .from("envios_agendados")
        .update({ status: "erro", erro: textoErro(e).slice(0, 500), tentativas: 1 })
        .eq("id", envio.id);
      resultado.erros++;
    }
  }
  return resultado;
}
