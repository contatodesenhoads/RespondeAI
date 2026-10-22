import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { supabaseServidor } from "@/lib/supabase/server";
import { urlAutorizacao } from "@/lib/instagram";
import { env } from "@/lib/env";

// Leva o cliente para a tela oficial de login do Instagram.
export async function GET() {
  const supabase = await supabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${env.siteUrl()}/login`);

  // "state" aleatório protege contra conexões forjadas.
  const state = randomBytes(24).toString("hex");
  const resposta = NextResponse.redirect(urlAutorizacao(state));
  resposta.cookies.set("ig_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return resposta;
}
