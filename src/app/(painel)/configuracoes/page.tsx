import Link from "next/link";
import { sessaoAtual } from "@/lib/conta";
import { Cabecalho, Cartao } from "@/components/ui";
import { BotaoConfirmar } from "@/components/BotaoConfirmar";
import { desconectarInstagram, sair } from "./acoes";
import { FormSenha } from "./FormSenha";
import { NOMES_RECURSOS, planoDe, temRecurso, type Recurso } from "@/lib/planos";

export const metadata = { title: "Configurações · Responde AI" };
export const dynamic = "force-dynamic";

export default async function Configuracoes() {
  const sessao = await sessaoAtual();
  const ig = sessao.instagram;
  const plano = planoDe(sessao.plano);

  return (
    <>
      <Cabecalho titulo="Configurações" />

      <Cartao className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Sua conta</h2>
        <p className="text-[15px]">
          {sessao.nome && <><b>{sessao.nome}</b> · </>}
          {sessao.email}
        </p>
        <form action={sair}>
          <button type="submit" className="min-h-11 text-sm font-semibold text-marsala">Sair do Responde AI</button>
        </form>
      </Cartao>

      <Cartao className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Seu plano</h2>
        <p className="text-[15px]">
          <b>{plano.nome}</b> · {plano.descricao}
        </p>
        <ul className="flex flex-col gap-1.5 text-sm">
          {(Object.keys(NOMES_RECURSOS) as Recurso[]).map((r) => (
            <li key={r} className={temRecurso(plano.id, r) ? "text-tinta" : "text-suave"}>
              {temRecurso(plano.id, r) ? "✓ " : ""}
              {NOMES_RECURSOS[r]}
              {!temRecurso(plano.id, r) && " · disponível no plano Completo"}
            </li>
          ))}
        </ul>
        {plano.id === "essencial" && (
          <p className="text-sm text-suave">
            Quer liberar as funções do plano Completo?{" "}
            <a href="mailto:contatodesenhoads@gmail.com?subject=Upgrade%20Responde%20AI" className="font-semibold">
              Fale com a Desenho Ads
            </a>
            .
          </p>
        )}
      </Cartao>

      <Cartao className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Instagram</h2>
        <p className="text-[15px]">
          {ig?.username ? <b>@{ig.username}</b> : "Nenhuma conta"} ·{" "}
          {ig?.status === "conectada" ? "conectado" : "reconexão necessária"}
        </p>
        <div className="flex flex-wrap gap-4">
          <Link href="/conectar-instagram?reconectar=1" className="inline-flex min-h-11 items-center text-sm font-semibold">
            Reconectar
          </Link>
          <form action={desconectarInstagram}>
            <BotaoConfirmar
              pergunta="Desconectar o Instagram? Todas as automações param até você conectar de novo."
              className="min-h-11 text-sm font-semibold text-erro"
            >
              Desconectar Instagram
            </BotaoConfirmar>
          </form>
        </div>
      </Cartao>

      <Cartao className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Trocar senha</h2>
        <FormSenha />
      </Cartao>
    </>
  );
}
