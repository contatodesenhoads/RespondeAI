import Link from "next/link";
import { redirect } from "next/navigation";
import { MenuLateral } from "@/components/MenuLateral";
import { contaBloqueada, sessaoAtual } from "@/lib/conta";

export default async function LayoutPainel({ children }: { children: React.ReactNode }) {
  const sessao = await sessaoAtual();

  // Assinatura pausada ou cancelada: painel bloqueado.
  if (contaBloqueada(sessao)) redirect("/conta-pausada");

  // Primeiro acesso: ainda não conectou o Instagram.
  if (!sessao.instagram) redirect("/conectar-instagram");

  const conectado = sessao.instagram.status === "conectada";

  return (
    <div className="flex min-h-screen flex-wrap md:flex-nowrap">
      <MenuLateral username={sessao.instagram.username} conectado={conectado} admin={sessao.papel === "admin"} />
      <main className="flex min-w-0 flex-[999_1_560px] flex-col gap-6 p-6 sm:p-10">
        {!conectado && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E9D3A6] bg-alerta-fundo px-5 py-4 text-alerta">
            <span className="text-[15px]">
              <b>A conexão com o Instagram caiu.</b> Suas automações estão paradas até você reconectar.
            </span>
            <Link
              href="/conectar-instagram?reconectar=1"
              className="rounded-lg bg-marsala px-4 py-2 text-sm font-semibold text-off no-underline hover:bg-marsala-escuro hover:text-off"
            >
              Reconectar
            </Link>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
