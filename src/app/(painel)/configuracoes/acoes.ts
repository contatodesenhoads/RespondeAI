"use server";

import { redirect } from "next/navigation";
import { sessaoAtual } from "@/lib/conta";
import { supabaseServidor } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function sair() {
  const supabase = await supabaseServidor();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function desconectarInstagram() {
  const sessao = await sessaoAtual();
  await supabaseAdmin().from("contas_instagram").delete().eq("cliente_id", sessao.clienteId);
  redirect("/conectar-instagram");
}

export type EstadoSenha = { erro?: string; ok?: boolean };

export async function trocarSenha(_: EstadoSenha, form: FormData): Promise<EstadoSenha> {
  const senha = String(form.get("senha") ?? "");
  const confirmar = String(form.get("confirmar") ?? "");
  if (senha.length < 8) return { erro: "A senha precisa ter pelo menos 8 caracteres." };
  if (senha !== confirmar) return { erro: "As senhas não são iguais." };
  const supabase = await supabaseServidor();
  const { error } = await supabase.auth.updateUser({ password: senha });
  if (error) return { erro: "Não foi possível trocar a senha. Tente de novo." };
  return { ok: true };
}
