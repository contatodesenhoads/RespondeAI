import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseServidor } from "@/lib/supabase/server";

// Destino dos links de acesso (convite e nova senha).
// Confere o código do link, abre a sessão e leva para a definição de senha.
const TIPOS: EmailOtpType[] = ["invite", "recovery", "magiclink", "signup", "email"];

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const tokenHash = p.get("token_hash");
  const tipo = p.get("type") as EmailOtpType | null;
  const destino = p.get("next") ?? "/definir-senha";
  const seguro = destino.startsWith("/") && !destino.startsWith("//") ? destino : "/definir-senha";

  if (tokenHash && tipo && TIPOS.includes(tipo)) {
    const supabase = await supabaseServidor();
    const { error } = await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash });
    if (!error) redirect(seguro);
  }

  redirect("/login?erro=link");
}
