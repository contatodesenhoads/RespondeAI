import { NextResponse, type NextRequest } from "next/server";
import { supabaseServidor } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { criptografar } from "@/lib/cripto";
import { env } from "@/lib/env";
import {
  inscreverWebhooks,
  minhaConta,
  tokenDeLongaDuracao,
  trocarCodigoPorToken,
} from "@/lib/instagram";

// Retorno da tela oficial do Instagram depois que o cliente autoriza.
export async function GET(request: NextRequest) {
  const base = env.siteUrl();
  const voltar = (erro: string) => {
    const r = NextResponse.redirect(`${base}/conectar-instagram?erro=${erro}`);
    r.cookies.delete("ig_oauth_state");
    return r;
  };

  const params = request.nextUrl.searchParams;
  if (params.get("error")) return voltar("negado");

  const code = params.get("code");
  const state = params.get("state");
  const esperado = request.cookies.get("ig_oauth_state")?.value;
  if (!code || !state || !esperado || state !== esperado) return voltar("estado");

  const supabase = await supabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${base}/login`);

  const { data: perfil } = await supabase
    .from("perfis")
    .select("cliente_id")
    .eq("id", user.id)
    .single();
  if (!perfil) return voltar("falha");

  try {
    // O Instagram devolve "#_" no fim do código em alguns casos.
    const curto = await trocarCodigoPorToken(code.replace(/#_$/, ""));
    const longo = await tokenDeLongaDuracao(curto.token);
    const conta = await minhaConta(longo.token);

    const admin = supabaseAdmin();

    // Um Instagram só pode estar ligado a um cliente.
    const { data: existente } = await admin
      .from("contas_instagram")
      .select("cliente_id")
      .eq("ig_user_id", conta.igUserId)
      .maybeSingle();
    if (existente && existente.cliente_id !== perfil.cliente_id) return voltar("ja_usada");

    const { error } = await admin.from("contas_instagram").upsert(
      {
        cliente_id: perfil.cliente_id,
        ig_user_id: conta.igUserId,
        username: conta.username,
        token_criptografado: criptografar(longo.token),
        token_expira_em: new Date(Date.now() + longo.expiraEmSegundos * 1000).toISOString(),
        status: "conectada",
        conectado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: "cliente_id" },
    );
    if (error) throw error;

    await inscreverWebhooks(longo.token);
  } catch (e) {
    console.error("Falha ao conectar Instagram", e);
    return voltar("falha");
  }

  const r = NextResponse.redirect(`${base}/inicio?conectado=1`);
  r.cookies.delete("ig_oauth_state");
  return r;
}
