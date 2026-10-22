import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { criptografar, descriptografar } from "@/lib/cripto";
import { renovarToken } from "@/lib/instagram";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const maxDuration = 60;

// Roda uma vez por dia (vercel.json). Renova os tokens que vencem em até
// 15 dias, para o cliente nunca precisar conectar o Instagram de novo.
export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${env.cronSecret()}`) {
    return new NextResponse("Não autorizado", { status: 401 });
  }

  const admin = supabaseAdmin();
  const limite = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
  const { data: contas } = await admin
    .from("contas_instagram")
    .select("id, token_criptografado")
    .eq("status", "conectada")
    .lt("token_expira_em", limite);

  let renovadas = 0;
  let falhas = 0;
  for (const conta of contas ?? []) {
    try {
      const novo = await renovarToken(descriptografar(conta.token_criptografado));
      await admin
        .from("contas_instagram")
        .update({
          token_criptografado: criptografar(novo.token),
          token_expira_em: new Date(Date.now() + novo.expiraEmSegundos * 1000).toISOString(),
          atualizado_em: new Date().toISOString(),
        })
        .eq("id", conta.id);
      renovadas++;
    } catch (e) {
      console.error("Falha ao renovar token", conta.id, e);
      // Token inválido (senha trocada, app removido): o painel pede reconexão.
      await admin.from("contas_instagram").update({ status: "erro" }).eq("id", conta.id);
      falhas++;
    }
  }

  return NextResponse.json({ renovadas, falhas });
}
