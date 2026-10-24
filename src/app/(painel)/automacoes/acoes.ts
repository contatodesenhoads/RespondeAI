"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { contaBloqueada, sessaoAtual } from "@/lib/conta";
import { supabaseServidor } from "@/lib/supabase/server";

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

export type EstadoForm = { erro?: string };

export async function salvarAutomacao(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const sessao = await sessaoAtual();
  if (contaBloqueada(sessao)) return { erro: "Sua assinatura está pendente. Regularize para editar automações." };
  const id = texto(form, "id", 64);
  const gatilhoBruto = texto(form, "gatilho");
  const gatilho = ["comentario", "direct", "story", "live"].includes(gatilhoBruto) ? gatilhoBruto : "comentario";
  const conteudoTipo = ["link", "texto", "arquivo"].includes(texto(form, "conteudo_tipo"))
    ? texto(form, "conteudo_tipo")
    : "link";
  const conteudoUrlBruta = texto(form, "conteudo_url", 2000);
  const conteudoUrl = urlSegura(conteudoUrlBruta);
  const status = texto(form, "acao") === "rascunho" ? "rascunho" : "ativa";

  const dados = {
    cliente_id: sessao.clienteId,
    nome: texto(form, "nome", 120),
    gatilho,
    post_id: gatilho === "comentario" ? texto(form, "post_id", 64) || null : null,
    post_legenda: texto(form, "post_legenda", 300) || null,
    post_miniatura: texto(form, "post_miniatura", 2000) || null,
    palavra_chave: texto(form, "palavra_chave", 60),
    resposta_publica: gatilho === "comentario" ? texto(form, "resposta_publica", 300) || null : null,
    mensagem_dm: texto(form, "mensagem_dm", 640),
    botao_dm: texto(form, "botao_dm", 20) || "Quero receber",
    exige_seguir: form.get("exige_seguir") === "on",
    mensagem_seguir: texto(form, "mensagem_seguir", 640) || null,
    botao_seguir: texto(form, "botao_seguir", 20) || "Já segui",
    conteudo_tipo: conteudoTipo,
    mensagem_entrega: texto(form, "mensagem_entrega", 900),
    conteudo_url: conteudoTipo === "texto" ? null : conteudoUrl,
    status,
    atualizado_em: new Date().toISOString(),
  };

  if (!dados.nome) return { erro: "Dê um nome para a automação." };
  if (!dados.palavra_chave) return { erro: "Informe a palavra-chave." };
  if (!dados.mensagem_dm) return { erro: "Escreva a primeira mensagem do direct." };
  if (!dados.mensagem_entrega) return { erro: "Escreva a mensagem de entrega." };
  if (conteudoTipo !== "texto" && !conteudoUrl) {
    return { erro: "Informe um link válido, começando com https://." };
  }
  if (dados.exige_seguir && !dados.mensagem_seguir) {
    return { erro: "Escreva a mensagem para quem ainda não segue." };
  }

  const supabase = await supabaseServidor();
  const { error } = id
    ? await supabase.from("automacoes").update(dados).eq("id", id)
    : await supabase.from("automacoes").insert(dados);
  if (error) return { erro: "Não foi possível salvar. Tente de novo." };

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
  await supabase.from("automacoes").delete().eq("id", id);
  revalidatePath("/automacoes");
  redirect("/automacoes");
}
