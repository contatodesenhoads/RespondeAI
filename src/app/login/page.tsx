import { Logo } from "@/components/Logo";
import { FormLogin } from "./FormLogin";

export const metadata = { title: "Entrar · Responde AI" };

export default function PaginaLogin() {
  return (
    <div className="flex min-h-screen flex-wrap">
      <div className="flex min-h-[360px] flex-[1_1_420px] flex-col justify-between gap-10 bg-marsala p-8 text-off sm:p-14">
        <div className="flex items-center gap-3.5">
          <Logo tamanho={52} className="rounded-[10px]" />
          <span className="text-[22px] font-bold tracking-tight">Responde AI</span>
        </div>
        <div className="flex max-w-[460px] flex-col gap-5">
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-[44px]">
            Cada comentário vira um seguidor. Cada seguidor, uma oportunidade.
          </h1>
          <p className="text-[17px] leading-relaxed text-[#E8DCDD]">
            Responda comentários, confira quem segue o perfil e entregue seu conteúdo no
            direct, no automático.
          </p>
        </div>
        <p className="text-[13px] text-[#E0D2D4]">Um produto Desenho Ads · Agência de tráfego pago</p>
      </div>
      <div className="flex flex-[1_1_420px] items-center justify-center px-6 py-12">
        <FormLogin />
      </div>
    </div>
  );
}
