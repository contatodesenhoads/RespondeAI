import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { contaBloqueada, sessaoAtual } from "@/lib/conta";
import { sair } from "@/app/(painel)/configuracoes/acoes";

export const metadata = { title: "Assinatura pendente · Responde AI" };
export const dynamic = "force-dynamic";

export default async function ContaPausada() {
  const sessao = await sessaoAtual();
  if (!contaBloqueada(sessao)) redirect("/");

  const cancelada = sessao.status === "cancelado";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-7 px-6 py-12">
      <div className="flex items-center gap-3">
        <Logo />
        <span className="text-lg font-bold">Responde AI</span>
      </div>
      <main className="flex w-full max-w-[560px] flex-col items-center gap-5 rounded-[20px] border border-linha bg-white p-8 text-center sm:p-10">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-alerta-fundo text-alerta">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        </div>
        <h1 className="text-[28px] font-bold tracking-tight">
          {cancelada ? "Sua assinatura foi cancelada" : "Sua assinatura está pendente"}
        </h1>
        <p className="text-base leading-relaxed text-tinta-2">
          {cancelada
            ? "As automações do seu Instagram estão desligadas. Para voltar a usar o Responde AI, fale com a Desenho Ads."
            : "As automações do seu Instagram estão pausadas até a regularização do pagamento. Assim que for regularizado, tudo volta a funcionar do jeito que estava: suas automações e configurações continuam salvas."}
        </p>
        <a
          href="mailto:contatodesenhoads@gmail.com?subject=Assinatura%20Responde%20AI"
          className="flex h-12 items-center rounded-[10px] bg-marsala px-6 text-[15px] font-semibold text-off no-underline hover:bg-marsala-escuro hover:text-off"
        >
          Falar com a Desenho Ads
        </a>
        <form action={sair}>
          <button type="submit" className="min-h-11 text-sm font-semibold text-suave hover:text-tinta">
            Sair
          </button>
        </form>
      </main>
      <p className="text-[13px] text-suave">Um produto Desenho Ads</p>
    </div>
  );
}
