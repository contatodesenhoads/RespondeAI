"use client";

import { useActionState } from "react";
import { salvarCliente, type EstadoSimples } from "@/app/admin/acoes";
import type { Plano } from "@/lib/planos";

const campo = "h-[46px] w-full rounded-[10px] border border-campo bg-white px-3.5 text-[15px] text-tinta";

export function FormDadosCliente({
  id,
  nome,
  plano,
  observacoes,
  planos,
}: {
  id: string;
  nome: string;
  plano: string;
  observacoes: string | null;
  planos: Plano[];
}) {
  const [estado, acao, enviando] = useActionState<EstadoSimples, FormData>(salvarCliente, {});
  return (
    <form action={acao} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={id} />
      <label htmlFor="nome" className="text-sm font-semibold">Empresa</label>
      <input id="nome" name="nome" defaultValue={nome} required maxLength={120} className={campo} />
      <label htmlFor="plano" className="text-sm font-semibold">Plano</label>
      <select id="plano" name="plano" defaultValue={plano} className={campo}>
        {planos.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nome}
            {p.precoMensal ? ` · R$ ${p.precoMensal.toFixed(2).replace(".", ",")}/mês` : " · sem cobrança"}
          </option>
        ))}
      </select>
      <p className="text-[13px] text-suave">Trocar o plano libera ou bloqueia as funções na hora.</p>
      <label htmlFor="observacoes" className="text-sm font-semibold">Observações internas</label>
      <textarea
        id="observacoes"
        name="observacoes"
        defaultValue={observacoes ?? ""}
        rows={3}
        maxLength={2000}
        className="rounded-[10px] border border-campo bg-white px-3.5 py-3 text-[15px]"
      />
      {estado.erro && <p role="alert" className="rounded-lg bg-erro-fundo px-3 py-2 text-sm text-erro">{estado.erro}</p>}
      {estado.ok && <p role="status" className="rounded-lg bg-ok-fundo px-3 py-2 text-sm text-ok">{estado.ok}</p>}
      <button type="submit" disabled={enviando} className="h-11 self-start rounded-[10px] bg-marsala px-5 text-sm font-semibold text-off hover:bg-marsala-escuro disabled:opacity-60">
        {enviando ? "Salvando…" : "Salvar alterações"}
      </button>
    </form>
  );
}
