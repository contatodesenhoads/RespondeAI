import Link from "next/link";
import { supabaseServidor } from "@/lib/supabase/server";
import { diasAtras, numero, resumo } from "@/lib/estatisticas";
import { Cabecalho, Cartao, Indicador } from "@/components/ui";

export const metadata = { title: "Dashboard · Responde AI" };
export const dynamic = "force-dynamic";

const PERIODOS = [7, 30, 90];

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const { p } = await searchParams;
  const dias = PERIODOS.includes(Number(p)) ? Number(p) : 30;
  const supabase = await supabaseServidor();

  const [r, { data: autos }] = await Promise.all([
    resumo(diasAtras(dias)),
    supabase.from("automacoes").select("id, nome").order("criado_em", { ascending: false }),
  ]);
  const g = r.geral;
  const base = g.comentou || 1;
  const pct = (n: number) => (g.comentou ? `${Math.round((n / base) * 100)}%` : "—");

  const funil = [
    { nome: "Comentaram", valor: g.comentou, cor: "bg-marsala" },
    { nome: "Clicaram no botão", valor: g.clicou_botao, cor: "bg-marsala" },
    { nome: "Já seguiam", valor: g.ja_seguia, cor: "bg-marsala-claro" },
    { nome: "Seguiram agora", valor: g.seguiu, cor: "bg-marsala-claro" },
    { nome: "Receberam o conteúdo", valor: g.entregou, cor: "bg-marsala" },
  ];

  const linhas = (autos ?? [])
    .map((a) => ({ ...a, t: r.porAutomacao.get(a.id) }))
    .filter((a) => a.t)
    .sort((a, b) => (b.t!.entregou ?? 0) - (a.t!.entregou ?? 0));

  const th = "border-b border-linha px-6 py-3.5 font-semibold";
  const td = "border-b border-linha-2 px-6 py-3.5";

  return (
    <>
      <Cabecalho
        titulo="Dashboard"
        subtitulo="Do comentário ao conteúdo entregue"
        acao={
          <div role="group" aria-label="Período" className="flex gap-2">
            {PERIODOS.map((d) => (
              <Link
                key={d}
                href={`/dashboard?p=${d}`}
                aria-current={d === dias ? "true" : undefined}
                className={`flex h-11 items-center rounded-full border px-4 text-sm no-underline ${
                  d === dias
                    ? "border-marsala bg-marsala font-semibold text-off hover:text-off"
                    : "border-campo bg-white font-medium text-tinta hover:text-tinta"
                }`}
              >
                {d} dias
              </Link>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <Indicador rotulo="Comentários com palavra-chave" valor={numero(g.comentou)} />
        <Indicador rotulo="Conteúdos entregues" valor={numero(g.entregou)} />
        <Indicador rotulo="Novos seguidores" valor={numero(g.seguiu)} destaque />
        <Indicador rotulo="Taxa de conversão" valor={pct(g.entregou)} nota="entregues ÷ comentários" />
        {(g.capturou_lead > 0 || g.remarketing > 0) && (
          <Indicador rotulo="Leads capturados" valor={numero(g.capturou_lead)} nota={`${numero(g.remarketing)} remarketing(s) enviados`} />
        )}
      </div>

      <Cartao className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-bold">Funil das automações</h2>
          <p className="text-sm text-suave">Quantas pessoas avançam em cada etapa, nos últimos {dias} dias.</p>
        </div>
        {funil.map((f) => (
          <div key={f.nome} className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="w-[200px] text-[15px] font-semibold">{f.nome}</span>
            <div className="h-7 min-w-0 flex-[1_1_300px] rounded-md bg-off">
              <div className={`h-7 rounded-md ${f.cor}`} style={{ width: `${g.comentou ? Math.max(2, (f.valor / base) * 100) : 0}%` }} />
            </div>
            <span className="w-[120px] text-right text-[15px]">
              <b>{numero(f.valor)}</b> <span className="text-[13px] text-suave">{pct(f.valor)}</span>
            </span>
          </div>
        ))}
        <p className="text-[13px] text-suave">
          “Novos seguidores” conta quem seguiu por meio de uma automação e clicou em “Já segui”.
          {g.erro > 0 && ` · ${numero(g.erro)} envio(s) com falha no período.`}
        </p>
      </Cartao>

      <section className="flex flex-col rounded-[14px] border border-linha bg-white">
        <h2 className="px-6 pb-2 pt-6 text-lg font-bold">Desempenho por automação</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-[15px]">
            <thead>
              <tr className="text-left text-[13px] text-suave">
                <th className={th}>Automação</th>
                <th className={`${th} text-right`}>Comentários</th>
                <th className={`${th} text-right`}>Novos seguidores</th>
                <th className={`${th} text-right`}>Leads</th>
                <th className={`${th} text-right`}>Entregas</th>
                <th className={`${th} text-right`}>Cliques no link</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((a) => (
                <tr key={a.id}>
                  <td className={`${td} font-semibold`}>{a.nome}</td>
                  <td className={`${td} text-right`}>{numero(a.t!.comentou)}</td>
                  <td className={`${td} text-right`}>{numero(a.t!.seguiu)}</td>
                  <td className={`${td} text-right`}>{numero(a.t!.capturou_lead)}</td>
                  <td className={`${td} text-right`}>{numero(a.t!.entregou)}</td>
                  <td className={`${td} text-right`}>{numero(a.t!.clicou_link)}</td>
                </tr>
              ))}
              {linhas.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-suave">Sem movimento neste período ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
