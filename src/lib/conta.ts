import "server-only";
import { redirect } from "next/navigation";
import { supabaseServidor } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { descriptografar } from "@/lib/cripto";
import type { PlanoId } from "@/lib/planos";

export type Sessao = {
  usuarioId: string;
  email: string | undefined;
  nome: string | null;
  clienteId: string;
  clienteNome: string;
  papel: "admin" | "cliente";
  plano: PlanoId;
  status: "ativo" | "pausado" | "cancelado";
  instagram: { username: string | null; status: string } | null;
};

// Carrega o usuário logado, o cliente dele (plano e status) e a conta do Instagram.
// Sem login → vai para /login.
export async function sessaoAtual(): Promise<Sessao> {
  const supabase = await supabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfis")
    .select("cliente_id, nome, papel")
    .eq("id", user.id)
    .single();
  if (!perfil) redirect("/login?erro=perfil");

  const [{ data: cliente }, { data: conta }] = await Promise.all([
    supabase.from("clientes").select("nome, plano, status").eq("id", perfil.cliente_id).single(),
    supabase.from("contas_instagram").select("username, status").eq("cliente_id", perfil.cliente_id).maybeSingle(),
  ]);

  return {
    usuarioId: user.id,
    email: user.email,
    nome: perfil.nome,
    clienteId: perfil.cliente_id,
    clienteNome: cliente?.nome ?? "",
    papel: perfil.papel,
    plano: (cliente?.plano ?? "essencial") as PlanoId,
    status: (cliente?.status ?? "ativo") as Sessao["status"],
    instagram: conta ? { username: conta.username, status: conta.status } : null,
  };
}

// Conta pausada ou cancelada não usa o painel (o administrador sempre passa).
export function contaBloqueada(sessao: Sessao) {
  return sessao.papel !== "admin" && sessao.status !== "ativo";
}

// Só a equipe da Desenho Ads (papel "admin") entra na área administrativa.
export async function exigirAdmin(): Promise<Sessao> {
  const sessao = await sessaoAtual();
  if (sessao.papel !== "admin") redirect("/");
  return sessao;
}

// Token do Instagram do cliente (só no servidor).
export async function tokenDoCliente(clienteId: string): Promise<string | null> {
  const { data } = await supabaseAdmin()
    .from("contas_instagram")
    .select("token_criptografado, status")
    .eq("cliente_id", clienteId)
    .maybeSingle();
  if (!data?.token_criptografado || data.status !== "conectada") return null;
  return descriptografar(data.token_criptografado);
}
