"use server";

import { redirect } from "next/navigation";
import { supabaseServidor } from "@/lib/supabase/server";

export type EstadoDefinirSenha = { erro?: string };

export async function definirSenha(_: EstadoDefinirSenha, form: FormData): Promise<EstadoDefinirSenha> {
  const senha = String(form.get("senha") ?? "");
  const confirmar = String(form.get("confirmar") ?? "");
  if (senha.length < 8) return { erro: "A senha precisa ter pelo menos 8 caracteres." };
  if (senha !== confirmar) return { erro: "As senhas não são iguais." };

  const supabase = await supabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "O link de acesso expirou. Peça um novo para a Desenho Ads." };

  const { error } = await supabase.auth.updateUser({ password: senha });
  if (error) return { erro: "Não foi possível salvar a senha. Tente de novo." };

  redirect("/");
}
