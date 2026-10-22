import Link from "next/link";
import { supabaseServidor } from "@/lib/supabase/server";
import { diasAtras, numero, resumo, tempoRelativo } from "@/lib/estatisticas";
import { BotaoNovaAutomacao, Cabecalho, SeloStatus, Vazio } from "@/components/ui";
import { alterarStatus } from "./acoes";

export const metadata = { title: "Automações · Responde AI" };
export const dynamic = "force-dynamic";

const FILTROS = [
  { id: "", rotulo: "Todas" },
  { id: "ativa", rotulo: "Ativas" },
  { id: "pausada", rotulo: "Pausadas" },
  { id: "rascunho", rotulo: "Rascunhos" },
];

export default async function Automacoes({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q = "", status = "" } = await searchParams;
  const supabase = await supabaseServidor();
  const [{ data }, mes] = await Promise.all([
    supabase
      .from("automacoes")
      .select("id, nome, gatilho, post_id, palavra_chave, exige_seguir, status, criado_em")
      .order("criado_em", { ascending: false }),
    resumo(diasAtras(30)),
  ]);

  const todas = data ?? [];
  const contagem = (s: string) => (s ? todas.filter((a) => a.status === s).length : todas.length);
  const busca = q.trim().toLowerCase();
  const lista = todas.filter(
    (a) =>
      (!status || a.status === status) &&
      (!busca || a.nome.toLowerCase().includes(busca) || a.palavra_chave.toLowerCase().includes(busca)),
  );

  const th = "border-b border-linha px-5 py-4 font-semibold";
  const td = "border-b border-linha-2 px-5 py-4";

  return (
    <>
      <Cabecalho
        titulo="Automações"
        subtitulo="Cada automação liga uma palavra-chave a um post e a um conteúdo"
        acao={<BotaoNovaAutomacao />}
      />

      {todas.length === 0 ? (
        <Vazio
          titulo="Nenhuma automação ainda"
          texto="Crie a primeira: quem comentar a palavra-chave recebe o conteúdo no direct."
          acao={<BotaoNovaAutomacao />}
        />
      ) : (
        <>
          <form className="flex flex-wrap items-center gap-3" action="/automacoes">
            <label htmlFor="busca" className="sr-only">Buscar automação</label>
            <input
              id="busca"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Buscar por nome ou palavra-chave"
              className="h-11 flex-[1_1_280px] rounded-[10px] border border-campo bg-white px-3.5 text-[15px]"
            />
            {status && <input type="hidden" name="status" value={status} />}
            <div className="flex flex-wrap gap-2">
              {FILTROS.map((f) => {
                const ativo = f.id === status;
                const href = `/automacoes?${new URLSearchParams({ ...(q ? { q } : {}), ...(f.id ? { status: f.id } : {}) })}`;
                return (
                  <Link
                    key={f.id}
                    href={href}
                    aria-current={ativo ? "true" : undefined}
                    className={`flex h-11 items-center rounded-full border px-4 text-sm no-underline ${
                      ativo
                        ? "border-marsala bg-marsala font-semibold text-off hover:text-off"
                        : "border-campo bg-white font-medium text-tinta hover:text-tinta"
                    }`}
                  >
                    {f.rotulo} ({contagem(f.id)})
                  </Link>
                );
              })}
            </div>
          </form>

          <div className="overflow-x-auto rounded-[14px] border border-linha bg-white">
            <table className="w-full min-w-[880px] border-collapse text-[15px]">
              <thead>
                <tr className="text-left text-[13px] text-suave">
                  <th className={th}>Automação</th>
                  <th className={th}>Palavra-chave</th>
                  <th className={th}>Exige seguir</th>
                  <th className={`${th} text-right`}>Comentários*</th>
                  <th className={`${th} text-right`}>Entregas*</th>
                  <th className={th}>Status</th>
                  <th className={th}><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {lista.map((a) => {
                  const t = mes.porAutomacao.get(a.id);
                  return (
                    <tr key={a.id}>
                      <td className={td}>
                        <Link href={`/automacoes/${a.id}`} className="font-semibold text-tinta no-underline hover:text-marsala">
                          {a.nome}
                        </Link>
                        <div className="text-[13px] text-suave">
                          {a.gatilho === "direct" ? "Direct" : a.post_id ? "Post específico" : "Qualquer post"} · criada {tempoRelativo(a.criado_em)}
                        </div>
                      </td>
                      <td className={td}>
                        <span className="rounded-md bg-off px-2.5 py-1 text-sm font-semibold">{a.palavra_chave}</span>
                      </td>
                      <td className={td}>{a.exige_seguir ? "Sim" : "Não"}</td>
                      <td className={`${td} text-right`}>{numero(t?.comentou ?? 0)}</td>
                      <td className={`${td} text-right font-semibold`}>{numero(t?.entregou ?? 0)}</td>
                      <td className={td}><SeloStatus status={a.status} /></td>
                      <td className={`${td} whitespace-nowrap text-right`}>
                        {a.status !== "rascunho" && (
                          <form action={alterarStatus} className="inline">
                            <input type="hidden" name="id" value={a.id} />
                            <input type="hidden" name="status" value={a.status === "ativa" ? "pausada" : "ativa"} />
                            <button type="submit" className="min-h-11 px-2 text-sm font-semibold text-marsala hover:text-marsala-escuro">
                              {a.status === "ativa" ? "Pausar" : "Ativar"}
                            </button>
                          </form>
                        )}
                        <Link href={`/automacoes/${a.id}`} className="ml-2 inline-flex min-h-11 items-center px-2 text-sm font-semibold">
                          Editar
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {lista.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-suave">Nenhuma automação encontrada.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-[13px] text-suave">* Últimos 30 dias.</p>
        </>
      )}
    </>
  );
}
