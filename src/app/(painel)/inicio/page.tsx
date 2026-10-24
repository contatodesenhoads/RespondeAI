import Link from "next/link";
import { sessaoAtual } from "@/lib/conta";
import { supabaseServidor } from "@/lib/supabase/server";
import { diasAtras, numero, resumo, tempoRelativo, variacao } from "@/lib/estatisticas";
import { BotaoNovaAutomacao, Cabecalho, Cartao, Indicador, Vazio } from "@/components/ui";

export const metadata = { title: "Início · Responde AI" };
export const dynamic = "force-dynamic";

const FRASES: Record<string, string> = {
  comentou: "comentou a palavra-chave",
  clicou_botao: "clicou no botão do direct",
  ja_seguia: "já seguia o perfil",
  pediu_seguir: "ainda não segue: convite enviado",
  seguiu: "seguiu o perfil",
  capturou_lead: "deixou o contato",
  remarketing: "recebeu o remarketing",
  entregou: "recebeu o conteúdo",
  clicou_link: "abriu o link entregue",
  erro: "teve uma falha no envio",
};

export default async function Inicio({ searchParams }: { searchParams: Promise<{ conectado?: string }> }) {
  const sessao = await sessaoAtual();
  const { conectado } = await searchParams;
  const supabase = await supabaseServidor();

  const [hoje, ontem, mes, autos, recentes] = await Promise.all([
    resumo(diasAtras(1)),
    resumo(diasAtras(2), diasAtras(1)),
    resumo(diasAtras(30)),
    supabase.from("automacoes").select("id, nome, status").order("criado_em", { ascending: false }),
    supabase
      .from("eventos")
      .select("id, tipo, criado_em, contatos(username), automacoes(nome)")
      .neq("tipo", "erro")
      .order("criado_em", { ascending: false })
      .limit(6),
  ]);

  const automacoes = autos.data ?? [];
  const ativas = automacoes.filter((a) => a.status === "ativa").length;
  const top = automacoes
    .map((a) => ({ ...a, entregas: mes.porAutomacao.get(a.id)?.entregou ?? 0 }))
    .filter((a) => a.entregas > 0)
    .sort((a, b) => b.entregas - a.entregas)
    .slice(0, 3);
  const maior = top[0]?.entregas ?? 1;

  const novosHoje = hoje.geral.seguiu;
  const primeiroNome = sessao.nome?.split(" ")[0];

  return (
    <>
      {conectado && (
        <p role="status" className="rounded-xl bg-ok-fundo px-5 py-4 text-[15px] text-ok">
          <b>Instagram conectado!</b> Agora é só criar sua primeira automação.
        </p>
      )}
      <Cabecalho
        titulo={primeiroNome ? `Olá, ${primeiroNome}` : "Olá!"}
        subtitulo="Resumo das últimas 24 horas"
        acao={<BotaoNovaAutomacao />}
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <Indicador
          rotulo="Comentários respondidos"
          valor={numero(hoje.geral.comentou)}
          nota={variacao(hoje.geral.comentou, ontem.geral.comentou) ? `${variacao(hoje.geral.comentou, ontem.geral.comentou)} vs. ontem` : "sem comparação ainda"}
          notaPositiva={hoje.geral.comentou >= ontem.geral.comentou && hoje.geral.comentou > 0}
        />
        <Indicador
          rotulo="Conteúdos entregues"
          valor={numero(hoje.geral.entregou)}
          nota={variacao(hoje.geral.entregou, ontem.geral.entregou) ? `${variacao(hoje.geral.entregou, ontem.geral.entregou)} vs. ontem` : "sem comparação ainda"}
          notaPositiva={hoje.geral.entregou >= ontem.geral.entregou && hoje.geral.entregou > 0}
        />
        <Indicador rotulo="Novos seguidores" valor={numero(novosHoje)} nota="vindos das automações" destaque />
        <Indicador rotulo="Automações ativas" valor={String(ativas)} nota={`de ${automacoes.length} criadas`} />
      </div>

      {automacoes.length === 0 ? (
        <Vazio
          titulo="Crie sua primeira automação"
          texto="Escolha um post, uma palavra-chave e o conteúdo que a pessoa recebe no direct. Leva dois minutos."
          acao={<BotaoNovaAutomacao />}
        />
      ) : (
        <div className="flex flex-wrap gap-5">
          <Cartao className="flex min-w-0 flex-[1_1_360px] flex-col gap-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-bold">Automações com mais entregas</h2>
              <Link href="/automacoes" className="text-sm font-semibold">Ver todas</Link>
            </div>
            {top.length === 0 && <p className="text-[15px] text-suave">Nenhuma entrega nos últimos 30 dias ainda.</p>}
            {top.map((a) => (
              <div key={a.id} className="flex flex-col gap-1.5">
                <div className="flex justify-between gap-3 text-[15px]">
                  <span className="font-semibold">{a.nome}</span>
                  <span className="text-suave">{numero(a.entregas)} entregas</span>
                </div>
                <div className="h-2 rounded bg-off">
                  <div className="h-2 rounded bg-marsala" style={{ width: `${Math.max(4, (a.entregas / maior) * 100)}%` }} />
                </div>
              </div>
            ))}
            <p className="text-[13px] text-suave">Últimos 30 dias</p>
          </Cartao>

          <Cartao className="flex min-w-0 flex-[1_1_360px] flex-col">
            <h2 className="mb-3 text-lg font-bold">Atividade recente</h2>
            {(recentes.data ?? []).length === 0 && (
              <p className="text-[15px] text-suave">Assim que alguém comentar a palavra-chave, aparece aqui.</p>
            )}
            {(recentes.data ?? []).map((ev, i, lista) => {
              const contato = Array.isArray(ev.contatos) ? ev.contatos[0] : ev.contatos;
              return (
                <div
                  key={ev.id}
                  className={`flex justify-between gap-3 py-3 text-sm ${i < lista.length - 1 ? "border-b border-linha-2" : ""}`}
                >
                  <span>
                    <b>{contato?.username ? `@${contato.username}` : "Alguém"}</b> {FRASES[ev.tipo] ?? ev.tipo}
                  </span>
                  <span className="whitespace-nowrap text-suave">{tempoRelativo(ev.criado_em)}</span>
                </div>
              );
            })}
          </Cartao>
        </div>
      )}
    </>
  );
}
