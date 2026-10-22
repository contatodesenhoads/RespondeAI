import Link from "next/link";

// Peças visuais reaproveitadas no painel.

export function Cabecalho({
  titulo,
  subtitulo,
  acao,
}: {
  titulo: string;
  subtitulo?: React.ReactNode;
  acao?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[30px] font-bold tracking-tight">{titulo}</h1>
        {subtitulo && <p className="text-[15px] text-suave">{subtitulo}</p>}
      </div>
      {acao}
    </div>
  );
}

export function BotaoNovaAutomacao() {
  return (
    <Link
      href="/automacoes/nova"
      className="flex h-[46px] items-center gap-2 rounded-[10px] bg-marsala px-5 text-[15px] font-semibold text-off no-underline hover:bg-marsala-escuro hover:text-off"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
      Nova automação
    </Link>
  );
}

export function Cartao({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[14px] border border-linha bg-white p-6 ${className}`}>{children}</section>;
}

export function Indicador({
  rotulo,
  valor,
  nota,
  notaPositiva,
  destaque,
}: {
  rotulo: string;
  valor: string;
  nota?: string | null;
  notaPositiva?: boolean;
  destaque?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-[14px] border border-linha bg-white p-5">
      <span className="text-sm font-medium text-suave">{rotulo}</span>
      <span className={`text-[34px] font-bold tracking-tight ${destaque ? "text-marsala" : ""}`}>{valor}</span>
      {nota && <span className={`text-[13px] ${notaPositiva ? "font-medium text-ok" : "text-suave"}`}>{nota}</span>}
    </div>
  );
}

export function SeloStatus({ status }: { status: string }) {
  const estilos: Record<string, string> = {
    ativa: "bg-ok-fundo text-ok",
    pausada: "bg-alerta-fundo text-alerta",
    rascunho: "bg-off text-suave",
  };
  const rotulos: Record<string, string> = { ativa: "Ativa", pausada: "Pausada", rascunho: "Rascunho" };
  return (
    <span className={`rounded-xl px-3 py-1 text-[13px] font-semibold ${estilos[status] ?? estilos.rascunho}`}>
      {rotulos[status] ?? status}
    </span>
  );
}

export function Vazio({ titulo, texto, acao }: { titulo: string; texto: string; acao?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[14px] border border-dashed border-campo bg-white px-6 py-14 text-center">
      <p className="text-lg font-bold">{titulo}</p>
      <p className="max-w-md text-[15px] text-suave">{texto}</p>
      {acao}
    </div>
  );
}
