"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";

const ITENS = [
  { href: "/admin", rotulo: "Visão geral", exato: true, icone: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /> },
  {
    href: "/admin/clientes",
    rotulo: "Clientes",
    exato: false,
    icone: <><circle cx="9" cy="8" r="4" /><path d="M2 21c0-4 3-6 7-6s7 2 7 6M17 11a3 3 0 1 0 0-6M22 21c0-3-2-5-4-5.5" /></>,
  },
  { href: "/admin/clientes/novo", rotulo: "Novo cliente", exato: true, icone: <path d="M12 5v14M5 12h14" /> },
];

export function MenuAdmin({ nome, sair }: { nome: string; sair: () => Promise<void> }) {
  const caminho = usePathname();

  return (
    <nav
      aria-label="Menu da administração"
      className="flex max-w-full flex-[1_1_232px] flex-col gap-7 bg-tinta px-4 py-7 text-off md:min-h-screen md:max-w-[260px]"
    >
      <div className="flex flex-col gap-3 px-2">
        <Link href="/admin" className="flex items-center gap-3 text-off no-underline hover:text-off">
          <Logo />
          <span className="text-lg font-bold">Responde AI</span>
        </Link>
        <span className="self-start rounded-md bg-marsala px-2 py-1 text-xs font-semibold uppercase tracking-wide text-off">
          Administração
        </span>
      </div>
      <div className="flex flex-col gap-1">
        {ITENS.map((item) => {
          const ativo = item.exato
            ? caminho === item.href
            : caminho.startsWith(item.href) && caminho !== "/admin/clientes/novo";
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={ativo ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-[15px] no-underline ${
                ativo
                  ? "bg-[rgba(242,239,238,0.14)] font-semibold text-white hover:text-white"
                  : "font-medium text-[#E5DCDD] hover:bg-[rgba(242,239,238,0.08)] hover:text-white"
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {item.icone}
              </svg>
              {item.rotulo}
            </Link>
          );
        })}
      </div>
      <div className="mt-auto flex flex-col gap-1 border-t border-[rgba(242,239,238,0.2)] px-2 pt-4">
        <span className="text-sm font-semibold">{nome}</span>
        <Link href="/inicio" className="flex min-h-11 items-center text-sm font-medium text-[#E5DCDD] no-underline hover:text-white">
          Abrir meu painel do Responde AI
        </Link>
        <form action={sair}>
          <button type="submit" className="min-h-11 text-sm font-medium text-[#E5DCDD] hover:text-white">Sair</button>
        </form>
      </div>
    </nav>
  );
}
