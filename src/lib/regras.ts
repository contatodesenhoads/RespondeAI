// Regras puras do motor (sem acesso a banco), fáceis de testar.

export function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// A palavra-chave precisa aparecer como palavra inteira:
// "prompt" casa com "Quero o PROMPT!", mas não com "prompts".
export function casaPalavra(texto: string, palavra: string) {
  const t = ` ${normalizar(texto)} `;
  const p = normalizar(palavra);
  return p.length > 0 && t.includes(` ${p} `);
}

// Sorteia uma das respostas preenchidas (variações da resposta pública).
export function escolherResposta(opcoes: (string | null | undefined)[], sorteio: () => number = Math.random) {
  const validas = opcoes.map((o) => (o ?? "").trim()).filter(Boolean);
  if (validas.length === 0) return null;
  return validas[Math.floor(sorteio() * validas.length) % validas.length];
}

export function validarEmail(texto: string): string | null {
  const achado = texto.trim().match(/[^\s@<>()]+@[^\s@<>()]+\.[a-zA-Z]{2,}/);
  return achado ? achado[0].toLowerCase().replace(/[.,;!?]+$/, "") : null;
}

// Aceita "(47) 99999-9999", "+55 47 99999 9999", "47999999999".
// Devolve só dígitos com o 55 do Brasil na frente.
export function normalizarWhatsapp(texto: string): string | null {
  const digitos = texto.replace(/\D/g, "");
  if (digitos.length === 10 || digitos.length === 11) return `55${digitos}`;
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith("55")) return digitos;
  return null;
}

export const MENSAGEM_CAPTURA_PADRAO = {
  email: "Antes de te enviar, qual é o seu melhor e-mail? É só responder aqui.",
  whatsapp: "Antes de te enviar, qual é o seu WhatsApp com DDD? É só responder aqui.",
} as const;
