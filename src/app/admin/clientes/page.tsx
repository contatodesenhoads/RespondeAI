import Link from "next/link";
import { listarClientes } from "@/lib/admin";
import { LISTA_PLANOS } from "@/lib/planos";
import { numero, tempoRelativo } from "@/lib/estatisticas";
import { Cabecalho } from "@/components/ui";
import { dataCurta, SeloCliente, SeloInstagram, SeloPlano } from "@/components/admin-ui";

export const metadata = { title: "Clientes · Administração" };

const FILTROS_STATUS = [
  { id: "", rotulo: "Todos" },
  { id: "ativo", rotulo: "Ativos" },
  { id: "pausado", rotulo: "Pausados" },
  { id: "cancelado", rotulo: "Cancelados" },
];

export default async function AdminClientes({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; plano?: string }>;
}) {
  const { q = "", status = "", plano = "" } = await searchParams;
  const todos = await listarClientes(30);
  const busca = q.trim().toLowerCase();

  const lista = todos.filter(
    (c) =>
      (!status || c.status === status) &&
      (!plano || c.plano === plano) &&
      (!busca ||
        c.nome.toLowerCase().includes(busca) ||
        c.usuarios.some((u) => u.email?.toLowerCase().includes(busca)) ||
        c.instagram?.username?.toLowerCase().includes(busca)),
  );
  const contagem = (s: string) => (s ? todos.filter((c) => c.status === s).length : todos.length);
  const href = (extra: Record<string, string>) => {
    const p = new URLSearchParams({ ...(q ? { q } : {}), ...(status ? { status } : {}), ...(plano ? { plano } : {}), ...extra });
    for (const [k, v] of [...p.entries()]) if (!v) p.delete(k);
    return `/admin/clientes?${p.toString()}`;
  };

  const th = "border-b border-linha px-5 py-4 font-semibold";
  const td = "border-b border-linha-2 px-5 py-4";
  const pilula = (ativo: boolean) =>
    `flex h-11 items-center rounded-full border px-4 text-sm no-underline ${
      ativo ? "border-marsala bg-marsala font-semibold text-off hover:text-off" : "border-campo bg-white font-medium text-tinta hover:text-tinta"
    }`;

  return (
    <>
      <Cabecalho
        titulo="Clientes"
        subtitulo={`${numero(todos.length)} cadastrados`}
        acao={
          <Link
            href="/admin/clientes/novo"
            className="flex h-[46px] items-center gap-2 rounded-[10px] bg-marsala px-5 text-[15px] font-semibold text-off no-underline hover:bg-marsala-escuro hover:text-off"
          >
            Novo cliente
          </Link>
        }
      />

      <form action="/admin/clientes" className="flex flex-wrap items-center gap-3">
        <label htmlFor="busca" className="sr-only">Buscar cliente</label>
        <input
          id="busca"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Buscar por empresa, e-mail ou @ do Instagram"
          className="h-11 flex-[1_1_300px] rounded-[10px] border border-campo bg-white px-3.5 text-[15px]"
        />
        {status && <input type="hidden" name="status" value={status} />}
        {plano && <input type="hidden" name="plano" value={plano} />}
        <button type="submit" className="h-11 rounded-[10px] border border-campo bg-white px-4 text-sm font-semibold">
          Buscar
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {FILTROS_STATUS.map((f) => (
          <Link key={f.id} href={href({ status: f.id })} aria-current={f.id === status ? "true" : undefined} className={pilula(f.id === status)}>
            {f.rotulo} ({contagem(f.id)})
          </Link>
        ))}
        <span className="mx-1 w-px self-stretch bg-linha" aria-hidden="true" />
        <Link href={href({ plano: "" })} aria-current={!plano ? "true" : undefined} className={pilula(!plano)}>
          Todos os planos
        </Link>
        {LISTA_PLANOS.map((p) => (
          <Link key={p.id} href={href({ plano: p.id })} aria-current={p.id === plano ? "true" : undefined} className={pilula(p.id === plano)}>
            {p.nome}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-[14px] border border-linha bg-white">
        <table className="w-full min-w-[920px] border-collapse text-[15px]">
          <thead>
            <tr className="text-left text-[13px] text-suave">
              <th className={th}>Cliente</th>
              <th className={th}>Plano</th>
              <th className={th}>Status</th>
              <th className={th}>Instagram</th>
              <th className={`${th} text-right`}>Entregas*</th>
              <th className={th}>Última atividade</th>
              <th className={th}>Cadastro</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((c) => (
              <tr key={c.id}>
                <td className={td}>
                  <Link href={`/admin/clientes/${c.id}`} className="font-semibold text-tinta no-underline hover:text-marsala">
                    {c.nome}
                  </Link>
                  <div className="text-[13px] text-suave">{c.usuarios[0]?.email ?? "sem usuário"}</div>
                </td>
                <td className={td}><SeloPlano plano={c.plano} /></td>
                <td className={td}><SeloCliente status={c.status} /></td>
                <td className={td}><SeloInstagram ig={c.instagram} /></td>
                <td className={`${td} text-right font-semibold`}>{numero(c.atividade.entregas)}</td>
                <td className={`${td} text-sm text-suave`}>{c.atividade.ultima ? tempoRelativo(c.atividade.ultima) : "—"}</td>
                <td className={`${td} text-sm text-suave`}>{dataCurta(c.criado_em)}</td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-suave">Nenhum cliente encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-[13px] text-suave">* Últimos 30 dias.</p>
    </>
  );
}
