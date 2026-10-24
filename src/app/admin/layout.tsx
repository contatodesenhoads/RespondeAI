import { MenuAdmin } from "@/components/MenuAdmin";
import { exigirAdmin } from "@/lib/conta";
import { sair } from "@/app/(painel)/configuracoes/acoes";

export const metadata = { title: "Administração · Responde AI" };
export const dynamic = "force-dynamic";

export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  const sessao = await exigirAdmin();

  return (
    <div className="flex min-h-screen flex-wrap md:flex-nowrap">
      <MenuAdmin nome={sessao.nome ?? sessao.email ?? "Desenho Ads"} sair={sair} />
      <main className="flex min-w-0 flex-[999_1_560px] flex-col gap-6 p-6 sm:p-10">{children}</main>
    </div>
  );
}
