import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { lerSignedRequest } from "@/lib/signed-request";

// URL de "Cancelar autorização" cadastrada no app da Meta:
// a pessoa removeu o Responde AI nas configurações do Instagram.
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const dados = lerSignedRequest(String(form.get("signed_request") ?? ""));
  if (!dados?.user_id) return new NextResponse("Requisição inválida", { status: 400 });

  await supabaseAdmin()
    .from("contas_instagram")
    .update({ status: "desconectada", token_criptografado: null })
    .eq("ig_user_id", String(dados.user_id));

  return NextResponse.json({ ok: true });
}
