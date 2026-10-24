"use server";

import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/lib/conta";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { linkDeAcesso } from "@/lib/admin";
import { env } from "@/lib/env";

const PLANOS = ["essencial", "completo", "cortesia"];
const STATUS = ["ativo", "pausado", "cancelado"];

function campo(form: FormData, nome: string, max = 500) {
  return String(form.get(nome) ?? "").trim().slice(0, max);
}

function mensagemErro(e: unknown) {
  const texto = e instanceof Error ? e.message : String(e);
  if (/already|registered|exists/i.test(texto)) return "Este e-mail já tem acesso ao Responde AI.";
  if (/rate|limit/i.test(texto)) return "Limite de envio de e-mails atingido. Use o link de acesso por enquanto.";
  return "Não foi possível concluir. Tente de novo.";
}

// ---------------------------------------------------------------------
// Novo cliente
// ---------------------------------------------------------------------

export type EstadoNovoCliente = {
  erro?: string;
  clienteId?: string;
  link?: string;
  emailEnviado?: string;
};

export async function criarCliente(_: EstadoNovoCliente, form: FormData): Promise<EstadoNovoCliente> {
  await exigirAdmin();
  const empresa = campo(form, "empresa", 120);
  const nome = campo(form, "nome", 120);
  const email = campo(form, "email", 200).toLowerCase();
  const plano = PLANOS.includes(campo(form, "plano")) ? campo(form, "plano") : "essencial";
  const entrega = campo(form, "entrega") === "email" && process.env.NEXT_PUBLIC_EMAIL_ATIVO === "1" ? "email" : "link";
  const observacoes = campo(form, "observacoes", 2000);

  if (!empresa) return { erro: "Informe o nome da empresa." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { erro: "Informe um e-mail válido." };

  const admin = supabaseAdmin();
  const dados = { empresa, nome, plano };
  let usuarioId: string | null = null;
  let link: string | undefined;

  try {
    if (entrega === "email") {
      const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
        data: dados,
        redirectTo: `${env.siteUrl()}/definir-senha`,
      });
      if (error) throw error;
      usuarioId = data.user?.id ?? null;
    } else {
      const r = await linkDeAcesso(email, "invite", dados);
      usuarioId = r.usuarioId;
      link = r.link;
    }
  } catch (e) {
    return { erro: mensagemErro(e) };
  }

  // O banco cria o cliente e o perfil sozinho; aqui só completamos os dados.
  const { data: perfil } = usuarioId
    ? await admin.from("perfis").select("cliente_id").eq("id", usuarioId).maybeSingle()
    : { data: null };
  if (perfil?.cliente_id && observacoes) {
    await admin.from("clientes").update({ observacoes }).eq("id", perfil.cliente_id);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/clientes");
  return {
    clienteId: perfil?.cliente_id,
    link,
    emailEnviado: entrega === "email" ? email : undefined,
  };
}

// ---------------------------------------------------------------------
// Edição do cliente
// ---------------------------------------------------------------------

export type EstadoSimples = { erro?: string; ok?: string };

export async function salvarCliente(_: EstadoSimples, form: FormData): Promise<EstadoSimples> {
  await exigirAdmin();
  const id = campo(form, "id", 64);
  const nome = campo(form, "nome", 120);
  const plano = campo(form, "plano");
  if (!nome) return { erro: "Informe o nome da empresa." };
  if (!PLANOS.includes(plano)) return { erro: "Plano inválido." };

  const { error } = await supabaseAdmin()
    .from("clientes")
    .update({ nome, plano, observacoes: campo(form, "observacoes", 2000) || null, atualizado_em: new Date().toISOString() })
    .eq("id", id);
  if (error) return { erro: "Não foi possível salvar." };

  revalidatePath(`/admin/clientes/${id}`);
  revalidatePath("/admin/clientes");
  return { ok: "Dados salvos." };
}

export async function mudarStatusCliente(form: FormData) {
  const sessao = await exigirAdmin();
  const id = campo(form, "id", 64);
  const status = campo(form, "status");
  if (!STATUS.includes(status)) return;
  if (id === sessao.clienteId && status !== "ativo") return; // a conta da agência nunca se bloqueia

  await supabaseAdmin()
    .from("clientes")
    .update({
      status,
      status_motivo: status === "ativo" ? null : campo(form, "motivo", 300) || null,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath(`/admin/clientes/${id}`);
  revalidatePath("/admin/clientes");
  revalidatePath("/admin");
}

// ---------------------------------------------------------------------
// Acesso do cliente (link ou e-mail para criar nova senha)
// ---------------------------------------------------------------------

export type EstadoAcesso = { erro?: string; link?: string; ok?: string };

export async function acessoDoUsuario(_: EstadoAcesso, form: FormData): Promise<EstadoAcesso> {
  await exigirAdmin();
  const email = campo(form, "email", 200);
  const modo = campo(form, "modo");
  if (!email) return { erro: "Usuário sem e-mail." };

  try {
    if (modo === "email" && process.env.NEXT_PUBLIC_EMAIL_ATIVO === "1") {
      const { error } = await supabaseAdmin().auth.resetPasswordForEmail(email, {
        redirectTo: `${env.siteUrl()}/definir-senha`,
      });
      if (error) throw error;
      return { ok: `E-mail de acesso enviado para ${email}.` };
    }
    const { link } = await linkDeAcesso(email, "recovery");
    return { link };
  } catch (e) {
    return { erro: mensagemErro(e) };
  }
}
