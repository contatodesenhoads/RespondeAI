"use server";

import { randomUUID } from "crypto";
import { contaBloqueada, sessaoAtual } from "@/lib/conta";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServidor } from "@/lib/supabase/server";
import { temRecurso } from "@/lib/planos";
import { BUCKET_MIDIAS, COTA_POR_CLIENTE, limiteDoTipo, nomeSeguro, tamanhoLegivel, tipoDaMidia } from "@/lib/midia";

export type PreparoUpload =
  | { ok: true; caminho: string; token: string; tipo: string; url: string }
  | { ok: false; erro: string };

// O servidor confere plano, tipo, tamanho e espaço, e devolve uma autorização
// de envio de uso único. O navegador envia o arquivo direto para o armazenamento.
export async function prepararUpload(nome: string, mime: string, tamanho: number, automacaoId?: string): Promise<PreparoUpload> {
  const sessao = await sessaoAtual();
  if (contaBloqueada(sessao)) return { ok: false, erro: "Sua assinatura está pendente." };
  if (!temRecurso(sessao.plano, "midia")) return { ok: false, erro: "Mídia na entrega faz parte do plano Completo." };

  const tipo = tipoDaMidia(mime, nome);
  if (!tipo) return { ok: false, erro: "Tipo de arquivo não aceito. Use JPG, PNG, MP4, MOV, MP3, M4A, WAV ou PDF." };
  if (tamanho > limiteDoTipo(tipo)) {
    return { ok: false, erro: `Arquivo grande demais (${tamanhoLegivel(tamanho)}). Limite: ${tamanhoLegivel(limiteDoTipo(tipo))}.` };
  }

  const supabase = await supabaseServidor();
  const { data: outras } = await supabase.from("automacoes").select("id, midia_tamanho").not("midia_path", "is", null);
  const usado = (outras ?? []).filter((a) => a.id !== automacaoId).reduce((s, a) => s + Number(a.midia_tamanho || 0), 0);
  if (usado + tamanho > COTA_POR_CLIENTE) {
    return { ok: false, erro: `Seu espaço de arquivos acabou (${tamanhoLegivel(COTA_POR_CLIENTE)}). Remova a mídia de outra automação.` };
  }

  const caminho = `${sessao.clienteId}/${randomUUID()}-${nomeSeguro(nome)}`;
  const armazenamento = supabaseAdmin().storage.from(BUCKET_MIDIAS);
  const { data, error } = await armazenamento.createSignedUploadUrl(caminho);
  if (error || !data) {
    const texto = error?.message ?? "";
    if (/bucket not found|not found/i.test(texto)) {
      return { ok: false, erro: "O espaço de arquivos ainda não foi criado. A Desenho Ads precisa rodar a atualização 004 do banco." };
    }
    return { ok: false, erro: `Não foi possível preparar o envio (${texto || "erro desconhecido"}).` };
  }
  const { data: publico } = armazenamento.getPublicUrl(caminho);
  return { ok: true, caminho, token: data.token, tipo, url: publico.publicUrl };
}

// Apaga um arquivo enviado nesta edição e substituído antes de salvar.
export async function descartarUpload(caminho: string) {
  const sessao = await sessaoAtual();
  if (!caminho.startsWith(`${sessao.clienteId}/`)) return;
  // Só apaga se nenhuma automação estiver usando o arquivo.
  const supabase = await supabaseServidor();
  const { count } = await supabase.from("automacoes").select("id", { count: "exact", head: true }).eq("midia_path", caminho);
  if ((count ?? 0) > 0) return;
  await supabaseAdmin().storage.from(BUCKET_MIDIAS).remove([caminho]);
}
