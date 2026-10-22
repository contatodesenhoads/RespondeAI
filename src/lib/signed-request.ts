import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { env } from "@/lib/env";

// Lê o "signed_request" que a Meta envia quando alguém remove o app
// ou pede a exclusão dos dados.
export function lerSignedRequest(signed: string): { user_id?: string } | null {
  const [assinatura, conteudo] = signed.split(".");
  if (!assinatura || !conteudo) return null;
  const esperado = createHmac("sha256", env.instagramAppSecret()).update(conteudo).digest();
  const recebido = Buffer.from(assinatura.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  if (recebido.length !== esperado.length || !timingSafeEqual(recebido, esperado)) return null;
  try {
    return JSON.parse(Buffer.from(conteudo.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
  } catch {
    return null;
  }
}
