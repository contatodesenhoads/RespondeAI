"use server";

import { redirect } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseServidor } from "@/lib/supabase/server";

const TIPOS: EmailOtpType[] = ["invite", "recovery", "magiclink", "signup", "email"];

// Só gasta o link quando a pessoa clica no botão (não quando o WhatsApp
// ou o e-mail "visitam" o endereço para montar a prévia).
export async function confirmarAcesso(form: FormData) {
  const tokenHash = String(form.get("token_hash") ?? "");
  const tipo = String(form.get("type") ?? "") as EmailOtpType;
  const destino = String(form.get("next") ?? "/definir-senha");
  const seguro = destino.startsWith("/") && !destino.startsWith("//") ? destino : "/definir-senha";

  if (!tokenHash || !TIPOS.includes(tipo)) redirect("/login?erro=link");

  const supabase = await supabaseServidor();
  const { error } = await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash });
  if (error) redirect("/login?erro=link");
  redirect(seguro);
}
