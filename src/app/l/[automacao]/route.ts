import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Link rastreável enviado na entrega: conta o clique e redireciona.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ automacao: string }> },
) {
  const { automacao } = await params;
  const contato = request.nextUrl.searchParams.get("c");
  const admin = supabaseAdmin();

  const { data: auto } = await admin
    .from("automacoes")
    .select("id, cliente_id, conteudo_url")
    .eq("id", automacao)
    .maybeSingle();

  if (!auto?.conteudo_url) {
    return new NextResponse("Link não encontrado.", { status: 404 });
  }

  await admin.from("eventos").insert({
    cliente_id: auto.cliente_id,
    automacao_id: auto.id,
    contato_id: contato && /^[0-9a-f-]{36}$/i.test(contato) ? contato : null,
    tipo: "clicou_link",
  });

  return NextResponse.redirect(auto.conteudo_url, 302);
}
