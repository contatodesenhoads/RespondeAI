import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { sessaoAtual } from "@/lib/conta";

export const metadata = { title: "Conecte seu Instagram · Responde AI" };

const ERROS: Record<string, string> = {
  negado: "A conexão foi cancelada na tela do Instagram. Tente de novo quando quiser.",
  estado: "A sessão de conexão expirou. Clique em “Conectar Instagram” de novo.",
  ja_usada: "Este Instagram já está conectado a outra conta do Responde AI.",
  falha: "Não foi possível concluir a conexão. Confira se a conta é profissional e tente de novo.",
};

const GARANTIAS = [
  {
    titulo: "Sua senha nunca passa por aqui",
    texto: "Você digita a senha na tela oficial do Instagram. O Responde AI recebe só uma autorização, nunca a sua senha.",
    icone: <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  },
  {
    titulo: "Só o que as automações precisam",
    texto: "Ler e responder comentários, enviar mensagens no direct para quem interagiu com você e conferir se a pessoa segue o seu perfil.",
    icone: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  },
  {
    titulo: "Nada é publicado no seu perfil",
    texto: "O Responde AI não publica no feed nem nos stories, e não segue nem deixa de seguir ninguém por você.",
    icone: <><circle cx="12" cy="12" r="9" /><path d="M5.6 5.6l12.8 12.8" /></>,
  },
  {
    titulo: "Você desconecta quando quiser",
    texto: "Em Configurações, com um clique, ou direto no Instagram, em Apps e sites.",
    icone: <path d="M18 6 6 18M6 6l12 12" />,
  },
];

export default async function ConectarInstagram({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; reconectar?: string }>;
}) {
  const sessao = await sessaoAtual();
  const { erro, reconectar } = await searchParams;
  if (sessao.instagram?.status === "conectada" && !reconectar) redirect("/inicio");

  const reconexao = Boolean(sessao.instagram) || Boolean(reconectar);

  return (
    <div className="flex min-h-screen flex-col items-center gap-7 px-6 pb-14 pt-10">
      <div className="flex w-full max-w-[640px] items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="text-lg font-bold">Responde AI</span>
        </div>
        <span className="text-sm text-suave">{reconexao ? "Reconexão" : "Primeiro acesso"}</span>
      </div>

      <main className="flex w-full max-w-[640px] flex-col gap-7 rounded-[20px] border border-linha bg-white p-6 sm:p-10">
        <div className="flex flex-col items-center gap-3.5 text-center">
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-[20px] bg-marsala text-off">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
            </svg>
          </div>
          <h1 className="text-[30px] font-bold tracking-tight">
            {reconexao ? "Reconecte seu Instagram" : "Conecte seu Instagram"}
          </h1>
          <p className="max-w-[480px] text-base leading-relaxed text-tinta-2">
            {reconexao
              ? "A conexão com o Instagram caiu. Conecte de novo para as suas automações voltarem a funcionar."
              : "Falta só um passo para criar suas automações. Você faz isso uma única vez: depois a conexão fica ativa sozinha."}
          </p>
        </div>

        {erro && ERROS[erro] && (
          <p role="alert" className="rounded-xl bg-erro-fundo px-4 py-3 text-sm text-erro">{ERROS[erro]}</p>
        )}

        <div className="flex flex-col gap-2.5">
          {/* Link comum: o servidor redireciona para a tela oficial do Instagram */}
          <a
            href="/api/instagram/conectar"
            className="flex h-[54px] items-center justify-center gap-2.5 rounded-xl bg-marsala text-[17px] font-semibold text-off no-underline hover:bg-marsala-escuro hover:text-off"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
            </svg>
            Conectar Instagram
          </a>
          <p className="text-center text-[13px] text-suave">
            Vai abrir a tela oficial do Instagram para você entrar e autorizar.
          </p>
        </div>

        <section aria-labelledby="seguranca" className="flex flex-col gap-4 rounded-[14px] bg-off-2 p-6">
          <h2 id="seguranca" className="text-[17px] font-bold">Sua conta protegida</h2>
          {GARANTIAS.map((g) => (
            <div key={g.titulo} className="flex items-start gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-linha bg-white text-marsala">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {g.icone}
                </svg>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[15px] font-semibold">{g.titulo}</p>
                <p className="text-sm leading-normal text-tinta-2">{g.texto}</p>
              </div>
            </div>
          ))}
        </section>

        <div className="flex items-start gap-3 rounded-xl border border-linha p-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#67202C" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="mt-px shrink-0">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5M12 16.5v.5" />
          </svg>
          <p className="text-sm leading-normal text-tinta-2">
            Seu Instagram precisa ser uma <b>conta profissional</b> (comercial ou criador de conteúdo). A troca
            é gratuita e leva um minuto: no app do Instagram, vá em Configurações › Tipo de conta e ferramentas.
          </p>
        </div>
      </main>

      <p className="text-[13px] text-suave">
        Um produto Desenho Ads · <Link href="/privacidade">Política de privacidade</Link>
        {reconexao && (
          <> · <Link href="/inicio">Voltar ao painel</Link></>
        )}
      </p>
    </div>
  );
}
