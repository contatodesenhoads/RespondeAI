"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseNavegador } from "@/lib/supabase/client";

const campo =
  "h-12 w-full rounded-[10px] border border-campo bg-white px-3.5 text-[15px] text-tinta";

export function FormLogin({ avisoInicial = null }: { avisoInicial?: string | null }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(avisoInicial);
  const [aviso, setAviso] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    const { error } = await supabaseNavegador().auth.signInWithPassword({ email, password: senha });
    setCarregando(false);
    if (error) {
      setErro("E-mail ou senha incorretos.");
      return;
    }
    router.replace("/");
    router.refresh();
  }

  async function esqueci() {
    setErro(null);
    if (process.env.NEXT_PUBLIC_EMAIL_ATIVO !== "1") {
      setAviso("Peça um novo link de acesso para a Desenho Ads pelo WhatsApp ou pelo e-mail contatodesenhoads@gmail.com.");
      return;
    }
    if (!email) {
      setErro("Digite seu e-mail acima para receber o link de nova senha.");
      return;
    }
    await supabaseNavegador().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/definir-senha`,
    });
    setAviso("Se o e-mail estiver cadastrado, você vai receber um link para criar uma nova senha.");
  }

  return (
    <form
      onSubmit={entrar}
      className="flex w-full max-w-[400px] flex-col gap-5 rounded-2xl border border-linha bg-white p-10"
    >
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[26px] font-bold tracking-tight">Entrar</h2>
        <p className="text-[15px] text-suave">Acesse o painel da sua conta.</p>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-semibold">E-mail</label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          placeholder="voce@empresa.com.br"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={campo}
        />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <label htmlFor="senha" className="text-sm font-semibold">Senha</label>
          <button type="button" onClick={esqueci} className="text-[13px] font-medium text-marsala hover:text-marsala-escuro">
            Esqueci minha senha
          </button>
        </div>
        <input
          id="senha"
          type="password"
          required
          autoComplete="current-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className={campo}
        />
      </div>
      {erro && <p role="alert" className="rounded-lg bg-erro-fundo px-3 py-2 text-sm text-erro">{erro}</p>}
      {aviso && <p role="status" className="rounded-lg bg-ok-fundo px-3 py-2 text-sm text-ok">{aviso}</p>}
      <button
        type="submit"
        disabled={carregando}
        className="h-[50px] rounded-[10px] bg-marsala text-base font-semibold text-off transition hover:bg-marsala-escuro disabled:opacity-60"
      >
        {carregando ? "Entrando…" : "Entrar"}
      </button>
      <p className="text-center text-[13px] text-suave">
        Ainda não tem acesso? <span className="font-semibold text-tinta">Fale com a Desenho Ads.</span>
      </p>
    </form>
  );
}
