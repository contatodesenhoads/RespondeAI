import Link from "next/link";
import { listarClientes } from "@/lib/admin";
import { brl, LISTA_PLANOS, planoDe } from "@/lib/planos";
import { numero, tempoRelativo } from "@/lib/estatisticas";
import { Cabecalho, Cartao, Indicador } from "@/components/ui";
import { SeloCliente, SeloInstagram, SeloPlano } from "@/components/admin-ui";

export const metadata = { title: "Visão geral · Administração" };

export default async function AdminVisaoGeral() {
  const clientes = await listarClientes(30);

  const ativos = clientes.filter((c) => c.status === "ativo");
  const pausados = clientes.filter((c) => c.status === "pausado");
  const cancelados = clientes.filter((c) => c.status === "cancelado");
  const receita = ativos.reduce((soma, c) => soma + planoDe(c.plano).precoMensal, 0);
  const conectados = ativos.filter((c) => c.instagram?.status === "conectada").length;
  const total = clientes.reduce(
    (t, c) => ({
      comentarios: t.comentarios + c.atividade.comentarios,
      entregas: t.entregas + c.atividade.entregas,
      seguidores: t.seguidores + c.atividade.seguidores,
    }),
    { comentarios: 0, entregas: 0, seguidores: 0 },
  );

  // Precisam de atenção: ativos sem Instagram ou com a conexão caída.
  const atencao = ativos.filter((c) => !c.instagram || c.instagram.status !== "conectada");

  return (
    <>
      <Cabecalho
        titulo="Visão geral"
        subtitulo="Todos os clientes do Responde AI"
        acao={
          <Link
            href="/admin/clientes/novo"
            className="flex h-[46px] items-center gap-2 rounded-[10px] bg-marsala px-5 text-[15px] font-semibold text-off no-underline hover:bg-marsala-escuro hover:text-off"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Novo cliente
          </Link>
        }
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <Indicador rotulo="Clientes ativos" valor={numero(ativos.length)} nota={`de ${numero(clientes.length)} cadastrados`} />
        <Indicador rotulo="Receita mensal estimada" valor={brl(receita)} nota="ativos × preço do plano" destaque />
        <Indicador
          rotulo="Pausados / cancelados"
          valor={`${pausados.length} / ${cancelados.length}`}
          nota={pausados.length > 0 ? "pausados aguardam pagamento" : "nenhuma pendência"}
        />
        <Indicador rotulo="Instagram conectados" valor={numero(conectados)} nota={`de ${numero(ativos.length)} clientes ativos`} />
      </div>

      <div className="flex flex-wrap gap-5">
        <Cartao className="flex min-w-0 flex-[1_1_320px] flex-col gap-3">
          <h2 className="text-lg font-bold">Clientes ativos por plano</h2>
          {LISTA_PLANOS.map((p) => {
            const qtd = ativos.filter((c) => c.plano === p.id).length;
            return (
              <div key={p.id} className="flex items-center justify-between gap-3 border-b border-linha-2 py-2 text-[15px] last:border-0">
                <span className="flex items-center gap-2">
                  <SeloPlano plano={p.id} />
                  <span className="text-sm text-suave">{p.precoMensal ? `${brl(p.precoMensal)}/mês` : "sem cobrança"}</span>
                </span>
                <b>{qtd}</b>
              </div>
            );
          })}
        </Cartao>

        <Cartao className="flex min-w-0 flex-[1_1_320px] flex-col gap-3">
          <h2 className="text-lg font-bold">Resultados de todos os clientes</h2>
          <p className="text-sm text-suave">Últimos 30 dias</p>
          <div className="flex justify-between border-b border-linha-2 py-2 text-[15px]"><span>Comentários com palavra-chave</span><b>{numero(total.comentarios)}</b></div>
          <div className="flex justify-between border-b border-linha-2 py-2 text-[15px]"><span>Conteúdos entregues</span><b>{numero(total.entregas)}</b></div>
          <div className="flex justify-between py-2 text-[15px]"><span>Novos seguidores gerados</span><b className="text-marsala">{numero(total.seguidores)}</b></div>
        </Cartao>
      </div>

      {(atencao.length > 0 || pausados.length > 0) && (
        <Cartao className="flex flex-col gap-2">
          <h2 className="text-lg font-bold">Precisam de atenção</h2>
          {[...atencao, ...pausados].map((c) => (
            <Link
              key={c.id}
              href={`/admin/clientes/${c.id}`}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-linha-2 py-3 text-tinta no-underline last:border-0 hover:text-marsala"
            >
              <span className="font-semibold">{c.nome}</span>
              <span className="flex items-center gap-3 text-sm text-suave">
                {c.status !== "ativo" ? (
                  <SeloCliente status={c.status} />
                ) : !c.instagram ? (
                  "Ainda não conectou o Instagram"
                ) : (
                  "Conexão com o Instagram caiu"
                )}
              </span>
            </Link>
          ))}
        </Cartao>
      )}

      <Cartao className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-bold">Últimos cadastros</h2>
          <Link href="/admin/clientes" className="text-sm font-semibold">Ver todos</Link>
        </div>
        {clientes.length === 0 && <p className="text-[15px] text-suave">Nenhum cliente ainda.</p>}
        {clientes.slice(0, 5).map((c) => (
          <Link
            key={c.id}
            href={`/admin/clientes/${c.id}`}
            className="flex flex-wrap items-center justify-between gap-3 border-b border-linha-2 py-3 text-tinta no-underline last:border-0 hover:text-marsala"
          >
            <span className="flex flex-col">
              <span className="font-semibold">{c.nome}</span>
              <span className="text-[13px] text-suave">cadastrado {tempoRelativo(c.criado_em)}</span>
            </span>
            <span className="flex items-center gap-3">
              <SeloInstagram ig={c.instagram} />
              <SeloPlano plano={c.plano} />
              <SeloCliente status={c.status} />
            </span>
          </Link>
        ))}
      </Cartao>
    </>
  );
}
