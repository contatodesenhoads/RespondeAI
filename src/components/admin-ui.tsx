import { planoDe, STATUS_CLIENTE } from "@/lib/planos";

export function SeloPlano({ plano }: { plano: string }) {
  const p = planoDe(plano);
  const estilo =
    p.id === "completo"
      ? "bg-marsala text-off"
      : p.id === "cortesia"
        ? "bg-off text-tinta-2 border border-campo"
        : "bg-[#F1E4E6] text-marsala";
  return <span className={`rounded-xl px-3 py-1 text-[13px] font-semibold ${estilo}`}>{p.nome}</span>;
}

export function SeloCliente({ status }: { status: string }) {
  const estilo =
    status === "ativo" ? "bg-ok-fundo text-ok" : status === "pausado" ? "bg-alerta-fundo text-alerta" : "bg-erro-fundo text-erro";
  return <span className={`rounded-xl px-3 py-1 text-[13px] font-semibold ${estilo}`}>{STATUS_CLIENTE[status] ?? status}</span>;
}

export function SeloInstagram({ ig }: { ig: { username: string | null; status: string } | null }) {
  if (!ig) return <span className="text-sm text-suave">Não conectado</span>;
  if (ig.status !== "conectada")
    return <span className="text-sm font-semibold text-alerta">@{ig.username} · reconectar</span>;
  return <span className="text-sm">@{ig.username}</span>;
}

export const dataCurta = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "—";
