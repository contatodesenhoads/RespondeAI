"use client";

import { useActionState } from "react";
import { acessoDoUsuario, type EstadoAcesso } from "@/app/admin/acoes";
import { CopiarLink } from "@/components/CopiarLink";

const EMAIL_ATIVO = process.env.NEXT_PUBLIC_EMAIL_ATIVO === "1";

export function AcessoUsuario({ email }: { email: string }) {
  const [estado, acao, enviando] = useActionState<EstadoAcesso, FormData>(acessoDoUsuario, {});
  return (
    <div className="flex flex-col gap-3">
      <form action={acao} className="flex flex-wrap gap-2">
        <input type="hidden" name="email" value={email} />
        <button
          type="submit"
          name="modo"
          value="link"
          disabled={enviando}
          className="h-11 rounded-[10px] border border-campo bg-white px-4 text-sm font-semibold text-tinta disabled:opacity-60"
        >
          Gerar link de acesso
        </button>
        {EMAIL_ATIVO && (<button
          type="submit"
          name="modo"
          value="email"
          disabled={enviando}
          className="h-11 rounded-[10px] border border-campo bg-white px-4 text-sm font-semibold text-tinta disabled:opacity-60"
        >
          Enviar e-mail para criar senha
        </button>)}
      </form>
      {estado.erro && <p role="alert" className="rounded-lg bg-erro-fundo px-3 py-2 text-sm text-erro">{estado.erro}</p>}
      {estado.ok && <p role="status" className="rounded-lg bg-ok-fundo px-3 py-2 text-sm text-ok">{estado.ok}</p>}
      {estado.link && (
        <CopiarLink link={estado.link} mensagem="Olá! Segue o seu link para acessar o Responde AI e criar sua senha:" />
      )}
    </div>
  );
}
