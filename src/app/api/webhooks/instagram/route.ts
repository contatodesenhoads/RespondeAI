import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import {
  contaPorIgUserId,
  processarComentario,
  processarMensagem,
  type Comentario,
  type EventoMensagem,
} from "@/lib/motor";

export const runtime = "nodejs";
export const maxDuration = 30;

// Verificação feita pela Meta ao cadastrar o webhook no painel do app.
export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  if (p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") === env.webhookVerifyToken()) {
    return new NextResponse(p.get("hub.challenge") ?? "", { status: 200 });
  }
  return new NextResponse("Token de verificação inválido", { status: 403 });
}

// Confere a assinatura: garante que o aviso veio mesmo da Meta.
function assinaturaValida(corpo: string, assinatura: string | null) {
  if (!assinatura?.startsWith("sha256=")) return false;
  const esperado = createHmac("sha256", env.instagramAppSecret()).update(corpo).digest("hex");
  const recebido = assinatura.slice(7);
  if (recebido.length !== esperado.length) return false;
  return timingSafeEqual(Buffer.from(recebido), Buffer.from(esperado));
}

type Entrada = {
  id: string;
  time?: number;
  changes?: { field: string; value: Comentario }[];
  messaging?: EventoMensagem[];
};

export async function POST(request: NextRequest) {
  const corpo = await request.text();
  if (!assinaturaValida(corpo, request.headers.get("x-hub-signature-256"))) {
    return new NextResponse("Assinatura inválida", { status: 401 });
  }

  let dados: { object?: string; entry?: Entrada[] };
  try {
    dados = JSON.parse(corpo);
  } catch {
    return new NextResponse("JSON inválido", { status: 400 });
  }

  for (const entrada of dados.entry ?? []) {
    try {
      const conta = await contaPorIgUserId(String(entrada.id));
      if (!conta) continue;

      for (const mudanca of entrada.changes ?? []) {
        if (mudanca.field === "comments") await processarComentario(conta, mudanca.value, "comentario");
        if (mudanca.field === "live_comments") await processarComentario(conta, mudanca.value, "live");
      }
      for (const ev of entrada.messaging ?? []) {
        await processarMensagem(conta, ev);
      }
    } catch (e) {
      console.error("Erro ao processar aviso do Instagram", e);
    }
  }

  // A Meta só precisa saber que recebemos.
  return NextResponse.json({ ok: true });
}
