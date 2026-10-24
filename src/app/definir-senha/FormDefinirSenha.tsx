"use client";

import { useActionState } from "react";
import { definirSenha, type EstadoDefinirSenha } from "./acoes";

const campo = "h-12 w-full rounded-[10px] border border-campo bg-white px-3.5 text-[15px] text-tinta";

export function FormDefinirSenha() {
  const [estado, acao, enviando] = useActionState<EstadoDefinirSenha, FormData>(definirSenha, {});
  return (
    <form action={acao} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="senha" className="text-sm font-semibold">Crie sua senha</label>
        <input id="senha" name="senha" type="password" autoComplete="new-password" minLength={8} required className={campo} />
        <span className="text-[13px] text-suave">Pelo menos 8 caracteres.</span>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="confirmar" className="text-sm font-semibold">Repita a senha</label>
        <input id="confirmar" name="confirmar" type="password" autoComplete="new-password" minLength={8} required className={campo} />
      </div>
      {estado.erro && <p role="alert" className="rounded-lg bg-erro-fundo px-3 py-2 text-sm text-erro">{estado.erro}</p>}
      <button
        type="submit"
        disabled={enviando}
        className="h-[50px] rounded-[10px] bg-marsala text-base font-semibold text-off hover:bg-marsala-escuro disabled:opacity-60"
      >
        {enviando ? "Salvando…" : "Salvar e entrar"}
      </button>
    </form>
  );
}
