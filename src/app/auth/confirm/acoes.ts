"use server";

import { redirect } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseServidor } from "@/lib/supabase/server";
import { limparLinkDeAcesso } from "./limpeza";

// Só gasta o link quando a pessoa clica no botão (não quando o WhatsApp
// ou o e-mail "visitam" o endereço para montar a prévia).
export async function confirmarAcesso(form: FormData) {
  const { tokenHash, tipo, destino } = limparLinkDeAcesso({
    token_hash: String(form.get("token_hash") ?? ""),
    type: String(form.get("type") ?? ""),
    next: String(form.get("next") ?? ""),
  });

  if (!tokenHash || !tipo) redirect("/login?erro=link");

  const supabase = await supabaseServidor();
  const { error } = await supabase.auth.verifyOtp({ type: tipo as EmailOtpType, token_hash: tokenHash });
  if (error) redirect("/login?erro=link");
  redirect(destino);
}
