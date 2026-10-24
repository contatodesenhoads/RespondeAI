// Planos do Responde AI e o que cada um libera.
// Um sistema só: cada cliente tem uma "etiqueta" de plano e as funções
// consultam essa etiqueta antes de aparecer.

export type PlanoId = "essencial" | "completo" | "cortesia";
export type Recurso = "midia" | "captura_lead" | "remarketing";

export type Plano = {
  id: PlanoId;
  nome: string;
  precoMensal: number; // R$ (usado na estimativa de receita do administrador)
  descricao: string;
  recursos: Recurso[];
};

export const PLANOS: Record<PlanoId, Plano> = {
  essencial: {
    id: "essencial",
    nome: "Essencial",
    precoMensal: 79.99,
    descricao: "1 Instagram, envio ilimitado, os quatro gatilhos, verificação de seguidor e dashboard.",
    recursos: [],
  },
  completo: {
    id: "completo",
    nome: "Completo",
    precoMensal: 99.99, // provisório: confirmar o valor final
    descricao: "Tudo do Essencial + mídia na entrega, captura de lead e remarketing.",
    recursos: ["midia", "captura_lead", "remarketing"],
  },
  cortesia: {
    id: "cortesia",
    nome: "Cortesia",
    precoMensal: 0,
    descricao: "Acesso completo sem cobrança (agência e clientes piloto).",
    recursos: ["midia", "captura_lead", "remarketing"],
  },
};

export const LISTA_PLANOS = [PLANOS.essencial, PLANOS.completo, PLANOS.cortesia];

export const NOMES_RECURSOS: Record<Recurso, string> = {
  midia: "Mídia na entrega (imagem, áudio, vídeo)",
  captura_lead: "Captura de e-mail ou WhatsApp",
  remarketing: "Remarketing depois da entrega",
};

export function planoDe(id: string | null | undefined): Plano {
  return PLANOS[(id as PlanoId) ?? "essencial"] ?? PLANOS.essencial;
}

export function temRecurso(plano: string | null | undefined, recurso: Recurso) {
  return planoDe(plano).recursos.includes(recurso);
}

export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const STATUS_CLIENTE: Record<string, string> = {
  ativo: "Ativo",
  pausado: "Pausado",
  cancelado: "Cancelado",
};
