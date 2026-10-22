import Link from "next/link";
import { Logo } from "@/components/Logo";

export function PaginaLegal({ titulo, atualizado, children }: { titulo: string; atualizado: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center px-6 py-10">
      <div className="flex w-full max-w-[760px] flex-col gap-8">
        <Link href="/login" className="flex items-center gap-3 text-tinta no-underline">
          <Logo />
          <span className="text-lg font-bold">Responde AI</span>
        </Link>
        <article className="flex flex-col gap-4 rounded-[20px] border border-linha bg-white p-6 text-[15px] leading-relaxed text-tinta-2 sm:p-10 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-tinta [&_li]:ml-5 [&_li]:list-disc">
          <h1 className="text-[28px] font-bold tracking-tight text-tinta">{titulo}</h1>
          <p className="text-sm text-suave">Última atualização: {atualizado}</p>
          {children}
        </article>
        <p className="text-center text-[13px] text-suave">
          Um produto Desenho Ads · <Link href="/privacidade">Privacidade</Link> · <Link href="/termos">Termos de uso</Link>
        </p>
      </div>
    </div>
  );
}
