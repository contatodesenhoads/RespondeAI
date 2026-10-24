"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { contaBloqueada, sessaoAtual } from "@/lib/conta";
import { supabaseServidor } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { temRecurso } from "@/lib/planos";
import { BUCKET_MIDIAS, COTA_POR_CLIENTE, limiteDoTipo, tamanhoLegivel, type TipoMidia } from "@/lib/midia";

function texto(form: FormData, campo: string, max = 1000) {
  return String(form.get(campo) ?? "").trim().slice(0, max);
}

function urlSegura(valor: string) {
  if (!valor) return null;
  try {
    const u = new URL(valor);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

async function apagarArquivo(caminho: string | null | undefined) {
  if (!caminho) return;
  try {
    await supabaseAdmin().storage.from(BUCKET_MIDIAS).remove([caminho]);
  } catch {
    // arquivo já não existia
  }
}

export type EstadoForm = { erro?: string };

const TIPOS_MIDIA: TipoMidia[] = ["image", "video", "audio", "file"];

export async function salvarAutomacao(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const sessao = await sessaoAtual();
  if (contaBloqueada(sessao)) return { erro: "Sua assinatura está pendente. Regularize para editar automações." };

  const podeCaptura = temRecurso(sessao.plano, "captura_lead");
  const podeMidia = temRecurso(sessao.plano, "midia");
  const podeRemarketing = temRecurso(sessao.plano, "remarketing");

  const id = texto(form, "id", 64);
  const gatilhoBruto = texto(form, "gatilho");
  const gatilho = ["comentario", "direct", "story", "live"].includes(gatilhoBruto) ? gatilhoBruto : "comentario";

  let conteudoTipo = texto(form, "conteudo_tipo");
  if (conteudoTipo === "arquivo") conteudoTipo = "link"; // formato antigo
  if (!["link", "texto", "midia"].includes(conteudoTipo)) conteudoTipo = "link";
  if (conteudoTipo === "midia" && !podeMidia) return { erro: "Mídia na entrega faz parte do plano Completo." };

  const conteudoUrl = urlSegura(texto(form, "conteudo_url", 2000));
  const status = texto(form, "acao") === "rascunho" ? "rascunho" : "ativa";
  const capturaAtiva = podeCaptura && form.get("captura_ativa") === "on";
  const remarketingAtivo = podeRemarketing && form.get("remarketing_ativo") === "on";
  const horas = Math.min(23, Math.max(1, Number(texto(form, "remarketing_horas", 3)) || 2));

  const supabase = await supabaseServidor();

  // Automação atual (para trocar ou apagar a mídia antiga).
  const { data: atual } = id
    ? await supabase.from("automacoes").select("midia_path").eq("id", id).maybeSingle()
    : { data: null };

  // Mídia: só arquivos da pasta do próprio cliente, dentro dos limites.
  let midia: { midia_path: string | null; midia_url: string | null; midia_tipo: string | null; midia_nome: string | null; midia_tamanho: number | null } = {
    midia_path: null,
    midia_url: null,
    midia_tipo: null,
    midia_nome: null,
    midia_tamanho: null,
  };
  if (conteudoTipo === "midia") {
    const caminho = texto(form, "midia_path", 400);
    const tipo = texto(form, "midia_tipo") as TipoMidia;
    const tamanho = Number(texto(form, "midia_tamanho", 20)) || 0;
    if (!caminho) return { erro: "Envie o arquivo que a pessoa vai receber." };
    if (!caminho.startsWith(`${sessao.clienteId}/`)) return { erro: "Arquivo inválido. Envie de novo." };
    if (!TIPOS_MIDIA.includes(tipo)) return { erro: "Tipo de arquivo não aceito." };
    if (tamanho > limiteDoTipo(tipo)) {
      return { erro: `Arquivo grande demais. Limite: ${tamanhoLegivel(limiteDoTipo(tipo))}.` };
    }

    // Espaço total do cliente (as outras automações + este arquivo).
    const { data: outras } = await supabase.from("automacoes").select("id, midia_tamanho").not("midia_path", "is", null);
    const usado = (outras ?? []).filter((a) => a.id !== id).reduce((s, a) => s + Number(a.midia_tamanho || 0), 0);
    if (usado + tamanho > COTA_POR_CLIENTE) {
      return { erro: `Seu espaço de arquivos acabou (${tamanhoLegivel(COTA_POR_CLIENTE)}). Remova a mídia de outra automação.` };
    }

    const { data: publico } = supabaseAdmin().storage.from(BUCKET_MIDIAS).getPublicUrl(caminho);
    midia = {
      midia_path: caminho,
      midia_url: publico.publicUrl,
      midia_tipo: tipo,
      midia_nome: texto(form, "midia_nome", 200) || null,
      midia_tamanho: tamanho,
    };
  }

  const dados = {
    cliente_id: sessao.clienteId,
    nome: texto(form, "nome", 120),
    gatilho,
    post_id: gatilho === "comentario" ? texto(form, "post_id", 64) || null : null,
    post_legenda: texto(form, "post_legenda", 300) || null,
    post_miniatura: texto(form, "post_miniatura", 2000) || null,
    palavra_chave: texto(form, "palavra_chave", 60),
    resposta_publica: gatilho === "comentario" ? texto(form, "resposta_publica", 300) || null : null,
    resposta_publica_2: gatilho === "comentario" ? texto(form, "resposta_publica_2", 300) || null : null,
    mensagem_dm: texto(form, "mensagem_dm", 640),
    botao_dm: texto(form, "botao_dm", 20) || "Quero receber",
    exige_seguir: form.get("exige_seguir") === "on",
    mensagem_seguir: texto(form, "mensagem_seguir", 640) || null,
    botao_seguir: texto(form, "botao_seguir", 20) || "Já segui",
    captura_ativa: capturaAtiva,
    captura_tipo: texto(form, "captura_tipo") === "whatsapp" ? "whatsapp" : "email",
    captura_mensagem: texto(form, "captura_mensagem", 640) || null,
    conteudo_tipo: conteudoTipo,
    mensagem_entrega: texto(form, "mensagem_entrega", 900),
    conteudo_url: conteudoTipo === "link" ? conteudoUrl : null,
    ...midia,
    remarketing_ativo: remarketingAtivo,
    remarketing_mensagem: texto(form, "remarketing_mensagem", 640) || null,
    remarketing_horas: horas,
    status,
    atualizado_em: new Date().toISOString(),
  };

  if (!dados.nome) return { erro: "Dê um nome para a automação." };
  if (!dados.palavra_chave) return { erro: "Informe a palavra-chave." };
  if (!dados.mensagem_dm) return { erro: "Escreva a primeira mensagem do direct." };
  if (!dados.mensagem_entrega) return { erro: "Escreva a mensagem de entrega." };
  if (conteudoTipo === "link" && !conteudoUrl) return { erro: "Informe um link válido, começando com https://." };
  if (dados.exige_seguir && !dados.mensagem_seguir) return { erro: "Escreva a mensagem para quem ainda não segue." };
  if (remarketingAtivo && !dados.remarketing_mensagem) return { erro: "Escreva a mensagem do remarketing." };

  const { error } = id
    ? await supabase.from("automacoes").update(dados).eq("id", id)
    : await supabase.from("automacoes").insert(dados);
  if (error) return { erro: "Não foi possível salvar. Tente de novo." };

  // Arquivo antigo substituído ou removido: libera o espaço.
  if (atual?.midia_path && atual.midia_path !== midia.midia_path) await apagarArquivo(atual.midia_path);

  revalidatePath("/automacoes");
  redirect("/automacoes");
}

export async function alterarStatus(form: FormData) {
  const sessao = await sessaoAtual();
  if (contaBloqueada(sessao)) return;
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "") === "ativa" ? "ativa" : "pausada";
  const supabase = await supabaseServidor();
  await supabase.from("automacoes").update({ status, atualizado_em: new Date().toISOString() }).eq("id", id);
  revalidatePath("/automacoes");
}

export async function excluirAutomacao(form: FormData) {
  await sessaoAtual();
  const id = String(form.get("id") ?? "");
  const supabase = await supabaseServidor();
  const { data: atual } = await supabase.from("automacoes").select("midia_path").eq("id", id).maybeSingle();
  await supabase.from("automacoes").delete().eq("id", id);
  await apagarArquivo(atual?.midia_path);
  revalidatePath("/automacoes");
  redirect("/automacoes");
}
