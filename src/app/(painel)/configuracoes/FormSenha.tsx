"use client";

import { useActionState } from "react";
import { trocarSenha, type EstadoSenha } from "./acoes";

const campo = "h-[46px] w-full rounded-[10px] border border-campo bg-white px-3.5 text-[15px]";

export function FormSenha() {
  const [estado, acao, enviando] = useActionState<EstadoSenha, FormData>(trocarSenha, {});
  return (
    <form action={acao} className="flex max-w-md flex-col gap-3">
      <label htmlFor="senha" className="text-sm font-semibold">Nova senha</label>
      <input id="senha" name="senha" type="password" autoComplete="new-password" minLength={8} required className={campo} />
      <label htmlFor="confirmar" className="text-sm font-semibold">Repita a nova senha</label>
      <input id="confirmar" name="confirmar" type="password" autoComplete="new-password" minLength={8} required className={campo} />
      {estado.erro && <p role="alert" className="rounded-lg bg-erro-fundo px-3 py-2 text-sm text-erro">{estado.erro}</p>}
      {estado.ok && <p role="status" className="rounded-lg bg-ok-fundo px-3 py-2 text-sm text-ok">Senha atualizada.</p>}
      <button type="submit" disabled={enviando} className="h-11 self-start rounded-[10px] bg-marsala px-5 text-sm font-semibold text-off disabled:opacity-60">
        {enviando ? "Salvando…" : "Salvar nova senha"}
      </button>
    </form>
  );
}
