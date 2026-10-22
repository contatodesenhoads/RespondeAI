import "server-only";
import { supabaseServidor } from "@/lib/supabase/server";

export type Totais = {
  comentou: number;
  clicou_botao: number;
  ja_seguia: number;
  pediu_seguir: number;
  seguiu: number;
  entregou: number;
  clicou_link: number;
  erro: number;
};

const VAZIO: Totais = {
  comentou: 0,
  clicou_botao: 0,
  ja_seguia: 0,
  pediu_seguir: 0,
  seguiu: 0,
  entregou: 0,
  clicou_link: 0,
  erro: 0,
};

export type Resumo = { geral: Totais; porAutomacao: Map<string, Totais> };

export async function resumo(desde: Date, ate: Date = new Date()): Promise<Resumo> {
  const supabase = await supabaseServidor();
  const { data } = await supabase.rpc("resumo_eventos", {
    desde: desde.toISOString(),
    ate: ate.toISOString(),
  });

  const geral: Totais = { ...VAZIO };
  const porAutomacao = new Map<string, Totais>();
  for (const linha of (data ?? []) as { automacao_id: string | null; tipo: keyof Totais; total: number }[]) {
    const n = Number(linha.total);
    if (linha.tipo in geral) geral[linha.tipo] += n;
    if (linha.automacao_id) {
      const t = porAutomacao.get(linha.automacao_id) ?? { ...VAZIO };
      if (linha.tipo in t) t[linha.tipo] += n;
      porAutomacao.set(linha.automacao_id, t);
    }
  }
  return { geral, porAutomacao };
}

export const totaisVazios = () => ({ ...VAZIO });

export function diasAtras(dias: number) {
  return new Date(Date.now() - dias * 24 * 60 * 60 * 1000);
}

export function variacao(atual: number, anterior: number) {
  if (anterior === 0) return atual > 0 ? "novo" : null;
  const v = Math.round(((atual - anterior) / anterior) * 100);
  return `${v >= 0 ? "+" : ""}${v}%`;
}

export const numero = (n: number) => n.toLocaleString("pt-BR");

export function tempoRelativo(data: string) {
  const s = Math.max(0, Math.round((Date.now() - new Date(data).getTime()) / 1000));
  if (s < 60) return "agora";
  const m = Math.round(s / 60);
  if (m < 60) return `há ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return `há ${d} ${d === 1 ? "dia" : "dias"}`;
}
