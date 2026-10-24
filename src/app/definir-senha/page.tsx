import { Logo } from "@/components/Logo";
import { sessaoAtual } from "@/lib/conta";
import { FormDefinirSenha } from "./FormDefinirSenha";

export const metadata = { title: "Crie sua senha · Responde AI" };
export const dynamic = "force-dynamic";

export default async function DefinirSenha() {
  const sessao = await sessaoAtual();
  const primeiroNome = sessao.nome?.split(" ")[0];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-7 px-6 py-12">
      <div className="flex items-center gap-3">
        <Logo />
        <span className="text-lg font-bold">Responde AI</span>
      </div>
      <main className="flex w-full max-w-[420px] flex-col gap-6 rounded-[20px] border border-linha bg-white p-8 sm:p-10">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[26px] font-bold tracking-tight">
            {primeiroNome ? `Bem-vindo, ${primeiroNome}!` : "Bem-vindo ao Responde AI!"}
          </h1>
          <p className="text-[15px] text-suave">
            Crie a senha que você vai usar para entrar. Seu e-mail de acesso é <b className="text-tinta">{sessao.email}</b>.
          </p>
        </div>
        <FormDefinirSenha />
      </main>
      <p className="text-[13px] text-suave">Um produto Desenho Ads</p>
    </div>
  );
}
