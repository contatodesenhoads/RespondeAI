import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { env } from "@/lib/env";

// Os tokens do Instagram são guardados criptografados (AES-256-GCM).
// Mesmo quem tiver acesso ao banco não consegue usá-los sem a chave do servidor.

function chave(): Buffer {
  return createHash("sha256").update(env.tokenEncryptionKey()).digest();
}

export function criptografar(texto: string): string {
  const iv = randomBytes(12);
  const cifra = createCipheriv("aes-256-gcm", chave(), iv);
  const dados = Buffer.concat([cifra.update(texto, "utf8"), cifra.final()]);
  const tag = cifra.getAuthTag();
  return [iv, tag, dados].map((b) => b.toString("base64")).join(".");
}

export function descriptografar(pacote: string): string {
  const [iv, tag, dados] = pacote.split(".").map((p) => Buffer.from(p, "base64"));
  const decifra = createDecipheriv("aes-256-gcm", chave(), iv);
  decifra.setAuthTag(tag);
  return Buffer.concat([decifra.update(dados), decifra.final()]).toString("utf8");
}
