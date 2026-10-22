"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";

const ITENS = [
  { href: "/inicio", rotulo: "Início", icone: <path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z" /> },
  { href: "/automacoes", rotulo: "Automações", icone: <path d="M13 2 4 14h7l-1 8 9-12h-7z" /> },
  {
    href: "/contatos",
    rotulo: "Contatos",
    icone: <><circle cx="9" cy="8" r="4" /><path d="M2 21c0-4 3-6 7-6s7 2 7 6M17 11a3 3 0 1 0 0-6M22 21c0-3-2-5-4-5.5" /></>,
  },
  { href: "/dashboard", rotulo: "Dashboard", icone: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /> },
  {
    href: "/configuracoes",
    rotulo: "Configurações",
    icone: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></>,
  },
];

export function MenuLateral({ username, conectado }: { username: string | null; conectado: boolean }) {
  const caminho = usePathname();

  return (
    <nav
      aria-label="Menu principal"
      className="flex max-w-full flex-[1_1_232px] flex-col gap-7 bg-marsala px-4 py-7 text-off md:min-h-screen md:max-w-[260px]"
    >
      <Link href="/inicio" className="flex items-center gap-3 px-2 text-off no-underline hover:text-off">
        <Logo />
        <span className="text-lg font-bold">Responde AI</span>
      </Link>
      <div className="flex flex-col gap-1">
        {ITENS.map((item) => {
          const ativo = caminho === item.href || caminho.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={ativo ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-[15px] no-underline ${
                ativo
                  ? "bg-[rgba(242,239,238,0.16)] font-semibold text-white hover:text-white"
                  : "font-medium text-[#EFE6E7] hover:bg-[rgba(242,239,238,0.08)] hover:text-white"
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
        <span className="text-sm font-semibold">{username ? `@${username}` : "Instagram"}</span>
        <span className="flex items-center gap-1.5 text-[13px] text-[#E0D2D4]">
          <span className={`inline-block h-2 w-2 rounded-full ${conectado ? "bg-[#8FD19E]" : "bg-[#F0B35A]"}`} />
          {conectado ? "Instagram conectado" : "Reconexão necessária"}
        </span>
        <span className="mt-2 text-xs text-[#D9C8CA]">Um produto Desenho Ads</span>
      </div>
    </nav>
  );
}
