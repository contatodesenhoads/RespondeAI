import Link from "next/link";
import { sessaoAtual } from "@/lib/conta";
import { Cabecalho, Cartao } from "@/components/ui";
import { BotaoConfirmar } from "@/components/BotaoConfirmar";
import { desconectarInstagram, sair } from "./acoes";
import { FormSenha } from "./FormSenha";

export const metadata = { title: "Configurações · Responde AI" };
export const dynamic = "force-dynamic";

export default async function Configuracoes() {
  const sessao = await sessaoAtual();
  const ig = sessao.instagram;

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
