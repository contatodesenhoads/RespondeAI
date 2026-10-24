import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirAdmin } from "@/lib/conta";
import { clientePorId } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { LISTA_PLANOS, NOMES_RECURSOS, planoDe, temRecurso, type Recurso } from "@/lib/planos";
import { numero, tempoRelativo } from "@/lib/estatisticas";
import { Cabecalho, Cartao, Indicador } from "@/components/ui";
import { BotaoConfirmar } from "@/components/BotaoConfirmar";
import { dataCurta, SeloCliente, SeloPlano } from "@/components/admin-ui";
import { mudarStatusCliente } from "@/app/admin/acoes";
import { FormDadosCliente } from "./FormDadosCliente";
import { AcessoUsuario } from "./AcessoUsuario";

export const metadata = { title: "Cliente · Administração" };

export default async function AdminCliente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessao = await exigirAdmin();
  const c = await clientePorId(id);
  if (!c) notFound();

  const { data: autos } = await supabaseAdmin().from("automacoes").select("status").eq("cliente_id", id);
  const ativas = (autos ?? []).filter((a) => a.status === "ativa").length;
  const plano = planoDe(c.plano);
  const contaDaAgencia = id === sessao.clienteId;

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <p className="text-sm text-suave">
          <Link href="/admin/clientes" className="font-medium">Clientes</Link> / {c.nome}
        </p>
        <Cabecalho
          titulo={c.nome}
          subtitulo={`Cliente desde ${dataCurta(c.criado_em)}${contaDaAgencia ? " · conta da agência" : ""}`}
          acao={
            <div className="flex gap-2">
              <SeloPlano plano={c.plano} />
              <SeloCliente status={c.status} />
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
        <Indicador rotulo="Comentários (30 dias)" valor={numero(c.atividade.comentarios)} />
        <Indicador rotulo="Entregas (30 dias)" valor={numero(c.atividade.entregas)} />
        <Indicador rotulo="Novos seguidores (30 dias)" valor={numero(c.atividade.seguidores)} destaque />
        <Indicador rotulo="Automações ativas" valor={String(ativas)} nota={`de ${(autos ?? []).length} criadas`} />
      </div>

      <div className="flex flex-wrap items-start gap-5">
        <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-5">
          <Cartao className="flex flex-col gap-3">
            <h2 className="text-lg font-bold">Dados e plano</h2>
            <FormDadosCliente id={c.id} nome={c.nome} plano={c.plano} observacoes={c.observacoes} planos={LISTA_PLANOS} />
            <ul className="mt-1 flex flex-col gap-1 border-t border-linha-2 pt-3 text-sm">
              {(Object.keys(NOMES_RECURSOS) as Recurso[]).map((r) => (
                <li key={r} className={temRecurso(plano.id, r) ? "text-tinta" : "text-suave"}>
                  {temRecurso(plano.id, r) ? "✓ " : "— "}
                  {NOMES_RECURSOS[r]}
                </li>
              ))}
            </ul>
          </Cartao>

          <Cartao className="flex flex-col gap-3">
            <h2 className="text-lg font-bold">Assinatura</h2>
            <p className="text-[15px]">
              Status atual: <SeloCliente status={c.status} />
              {c.status_motivo && <span className="mt-2 block text-sm text-suave">Motivo: {c.status_motivo}</span>}
            </p>
            {contaDaAgencia ? (
              <p className="text-sm text-suave">A conta da agência não pode ser pausada.</p>
            ) : (
              <>
                {c.status !== "ativo" && (
                  <form action={mudarStatusCliente}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="status" value="ativo" />
                    <button type="submit" className="h-11 rounded-[10px] bg-marsala px-5 text-sm font-semibold text-off hover:bg-marsala-escuro">
                      Reativar cliente
                    </button>
                  </form>
                )}
                {c.status === "ativo" && (
                  <form action={mudarStatusCliente} className="flex flex-col gap-3">
                    <input type="hidden" name="id" value={c.id} />
                    <label htmlFor="motivo" className="text-sm font-semibold">Motivo (opcional)</label>
                    <input id="motivo" name="motivo" maxLength={300} placeholder="Ex.: pagamento em atraso" className="h-[46px] rounded-[10px] border border-campo bg-white px-3.5 text-[15px]" />
                    <div className="flex flex-wrap gap-2">
                      <BotaoConfirmar
                        nome="status"
                        valor="pausado"
                        pergunta="Pausar este cliente? O painel fica bloqueado e as automações param até você reativar."
                        className="h-11 rounded-[10px] border border-[#E9D3A6] bg-alerta-fundo px-4 text-sm font-semibold text-alerta"
                      >
                        Pausar
                      </BotaoConfirmar>
                      <BotaoConfirmar
                        nome="status"
                        valor="cancelado"
                        pergunta="Cancelar este cliente? O painel fica bloqueado e as automações param. Os dados continuam salvos."
                        className="h-11 rounded-[10px] border border-[#F0C4C4] bg-erro-fundo px-4 text-sm font-semibold text-erro"
                      >
                        Cancelar assinatura
                      </BotaoConfirmar>
                    </div>
                  </form>
                )}
                <p className="text-[13px] text-suave">
                  Pausado ou cancelado: o cliente vê a tela “Assinatura pendente” e as automações param. Ao reativar, tudo volta como estava.
                </p>
              </>
            )}
          </Cartao>
        </div>

        <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-5">
          <Cartao className="flex flex-col gap-4">
            <h2 className="text-lg font-bold">Acesso</h2>
            {c.usuarios.length === 0 && <p className="text-[15px] text-suave">Nenhum usuário ligado a este cliente.</p>}
            {c.usuarios.map((u) => (
              <div key={u.id} className="flex flex-col gap-3 border-b border-linha-2 pb-4 last:border-0 last:pb-0">
                <p className="text-[15px]">
                  <b>{u.nome || "Sem nome"}</b> · {u.email}
                  {u.papel === "admin" && <span className="ml-2 rounded-md bg-tinta px-2 py-0.5 text-xs font-semibold text-off">admin</span>}
                </p>
                {u.email && <AcessoUsuario email={u.email} />}
              </div>
            ))}
            <p className="text-[13px] text-suave">
              Use quando o cliente esquecer a senha ou não tiver recebido o convite. O link abre direto a tela de criar senha.
            </p>
          </Cartao>

          <Cartao className="flex flex-col gap-2">
            <h2 className="text-lg font-bold">Instagram</h2>
            {c.instagram ? (
              <>
                <p className="text-[15px]">
                  <a href={`https://instagram.com/${c.instagram.username}`} target="_blank" rel="noreferrer" className="font-semibold">
                    @{c.instagram.username}
                  </a>{" "}
                  · {c.instagram.status === "conectada" ? "conectado" : "precisa reconectar"}
                </p>
                <p className="text-sm text-suave">Conectado {tempoRelativo(c.instagram.conectado_em)}</p>
                {c.instagram.token_expira_em && (
                  <p className="text-sm text-suave">Autorização renovada automaticamente (vence em {dataCurta(c.instagram.token_expira_em)})</p>
                )}
              </>
            ) : (
              <p className="text-[15px] text-suave">O cliente ainda não conectou o Instagram.</p>
            )}
            <p className="text-sm text-suave">
              Última atividade: {c.atividade.ultima ? tempoRelativo(c.atividade.ultima) : "nenhuma nos últimos 30 dias"}
            </p>
          </Cartao>
        </div>
      </div>
    </>
  );
}
