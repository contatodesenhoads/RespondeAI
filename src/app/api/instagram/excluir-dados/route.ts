import { randomBytes } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { lerSignedRequest } from "@/lib/signed-request";
import { env } from "@/lib/env";

// URL de "Solicitação de exclusão de dados" cadastrada no app da Meta.
// Apaga a conexão e o histórico ligado àquele Instagram.
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const dados = lerSignedRequest(String(form.get("signed_request") ?? ""));
  if (!dados?.user_id) return new NextResponse("Requisição inválida", { status: 400 });

  const admin = supabaseAdmin();
  const { data: conta } = await admin
    .from("contas_instagram")
    .select("cliente_id")
    .eq("ig_user_id", String(dados.user_id))
    .maybeSingle();

  if (conta) {
    await admin.from("eventos").delete().eq("cliente_id", conta.cliente_id);
    await admin.from("contatos").delete().eq("cliente_id", conta.cliente_id);
    await admin.from("contas_instagram").delete().eq("ig_user_id", String(dados.user_id));
  }

  const codigo = randomBytes(8).toString("hex");
  return NextResponse.json({
    url: `${env.siteUrl()}/exclusao-de-dados?codigo=${codigo}`,
    confirmation_code: codigo,
  });
}
