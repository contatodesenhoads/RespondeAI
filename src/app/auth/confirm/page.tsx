import { Logo } from "@/components/Logo";
import { confirmarAcesso } from "./acoes";
import { limparLinkDeAcesso } from "./limpeza";

export const metadata = { title: "Acessar · Responde AI", robots: { index: false } };
export const dynamic = "force-dynamic";

// Tela intermediária do link de acesso. Abrir a página não gasta o link:
// ele só é usado quando a pessoa clica no botão.
export default async function ConfirmarAcesso({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string; next?: string }>;
}) {
  const bruto = await searchParams;
  const { tokenHash: token_hash, tipo, destino: next } = limparLinkDeAcesso(bruto);
  const type = tipo ?? "";
  const recuperacao = type === "recovery";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-7 px-6 py-12">
      <div className="flex items-center gap-3">
        <Logo />
        <span className="text-lg font-bold">Responde AI</span>
      </div>
      <main className="flex w-full max-w-[440px] flex-col items-center gap-5 rounded-[20px] border border-linha bg-white p-8 text-center sm:p-10">
        <h1 className="text-[26px] font-bold tracking-tight">
          {recuperacao ? "Vamos criar uma nova senha" : "Seu acesso está pronto"}
        </h1>
        <p className="text-[15px] leading-relaxed text-tinta-2">
          {recuperacao
            ? "Clique no botão abaixo para criar uma nova senha para o Responde AI."
            : "Clique no botão abaixo para criar sua senha e entrar no Responde AI."}
        </p>
        {token_hash ? (
          <form action={confirmarAcesso} className="w-full">
            <input type="hidden" name="token_hash" value={token_hash} />
            <input type="hidden" name="type" value={type} />
            <input type="hidden" name="next" value={next} />
            <button
              type="submit"
              className="h-[52px] w-full rounded-[10px] bg-marsala text-base font-semibold text-off hover:bg-marsala-escuro"
            >
              Acessar o Responde AI
            </button>
          </form>
        ) : (
          <p className="rounded-lg bg-erro-fundo px-3 py-2 text-sm text-erro">Link incompleto. Peça um novo para a Desenho Ads.</p>
        )}
      </main>
      <p className="text-[13px] text-suave">Um produto Desenho Ads</p>
    </div>
  );
}
