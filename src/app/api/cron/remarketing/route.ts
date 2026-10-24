import { NextResponse, type NextRequest } from "next/server";
import { enviarRemarketingsPendentes } from "@/lib/motor";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const maxDuration = 60;

// Chamado a cada 5 minutos pelo agendador do Supabase (pg_cron).
// Envia os remarketings cujo horário chegou, dentro da janela de 24 h.
export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${env.cronSecret()}`) {
    return new NextResponse("Não autorizado", { status: 401 });
  }
  const resultado = await enviarRemarketingsPendentes();
  return NextResponse.json(resultado);
}
