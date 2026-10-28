import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { env } from "@/lib/env";

// Dados e ferramentas da área administrativa (uso só no servidor,
// sempre depois de exigirAdmin()).

export type ClienteAdmin = {
  id: string;
  nome: string;
  plano: string;
  status: string;
  status_motivo: string | null;
  observacoes: string | null;
  criado_em: string;
  atualizado_em: string | null;
  usuarios: { id: string; email: string | null; nome: string | null; papel: string }[];
  instagram: { username: string | null; status: string; conectado_em: string; token_expira_em: string | null } | null;
  atividade: { comentarios: number; entregas: number; seguidores: number; ultima: string | null };
};

const um = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? (v[0] ?? null) : (v ?? null));

export async function listarClientes(dias = 30): Promise<ClienteAdmin[]> {
  const admin = supabaseAdmin();
  const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: clientes, error }, { data: resumo }] = await Promise.all([
    admin
      .from("clientes")
      .select(
        "id, nome, plano, status, status_motivo, observacoes, criado_em, atualizado_em, perfis(id, email, nome, papel), contas_instagram(username, status, conectado_em, token_expira_em)",
      )
      .order("criado_em", { ascending: false }),
    admin.rpc("admin_resumo_clientes", { desde }),
  ]);
  if (error) throw error;

  const porCliente = new Map<string, { comentarios: number; entregas: number; seguidores: number; ultima: string | null }>();
  for (const r of (resumo ?? []) as {
    cliente_id: string;
    comentarios: number;
    entregas: number;
    seguidores: number;
    ultima_atividade: string | null;
  }[]) {
    porCliente.set(r.cliente_id, {
      comentarios: Number(r.comentarios),
      entregas: Number(r.entregas),
      seguidores: Number(r.seguidores),
      ultima: r.ultima_atividade,
    });
  }

  return (clientes ?? []).map((c) => ({
    id: c.id,
    nome: c.nome,
    plano: c.plano,
    status: c.status,
    status_motivo: c.status_motivo,
    observacoes: c.observacoes,
    criado_em: c.criado_em,
    atualizado_em: c.atualizado_em,
    usuarios: (c.perfis ?? []) as ClienteAdmin["usuarios"],
    instagram: um(c.contas_instagram) as ClienteAdmin["instagram"],
    atividade: porCliente.get(c.id) ?? { comentarios: 0, entregas: 0, seguidores: 0, ultima: null },
  }));
}

export async function clientePorId(id: string): Promise<ClienteAdmin | null> {
  const lista = await listarClientes();
  return lista.find((c) => c.id === id) ?? null;
}

// Link de acesso pessoal: abre o Responde AI já na tela de criar senha.
// Serve para enviar por WhatsApp quando o e-mail ainda não estiver configurado.
export async function linkDeAcesso(
  email: string,
  tipo: "invite" | "recovery",
  dados?: Record<string, string>,
): Promise<{ link: string; usuarioId: string | null }> {
  const admin = supabaseAdmin();
  const redirectTo = `${env.siteUrl()}/definir-senha`;
  const { data, error } =
    tipo === "invite"
      ? await admin.auth.admin.generateLink({ type: "invite", email, options: { data: dados, redirectTo } })
      : await admin.auth.admin.generateLink({ type: "recovery", email, options: { redirectTo } });
  if (error || !data?.properties?.hashed_token) throw error ?? new Error("Link não gerado");
  const link = `${env.siteUrl()}/auth/confirm?token_hash=${data.properties.hashed_token}&type=${tipo}`;
  return { link, usuarioId: data.user?.id ?? null };
}
