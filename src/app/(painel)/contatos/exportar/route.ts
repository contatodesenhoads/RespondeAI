import { NextResponse, type NextRequest } from "next/server";
import { supabaseServidor } from "@/lib/supabase/server";

// Planilha (CSV) com os contatos do cliente logado. As regras de acesso do
// banco garantem que cada cliente só exporta os próprios contatos.
function celula(valor: unknown) {
  const texto = valor === null || valor === undefined ? "" : String(valor);
  // Evita que planilhas interpretem o conteúdo como fórmula.
  const seguro = /^[=+\-@]/.test(texto) ? `'${texto}` : texto;
  return `"${seguro.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  const supabase = await supabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Não autorizado", { status: 401 });

  const soLeads = request.nextUrl.searchParams.get("filtro") === "leads";
  const linhas: Record<string, unknown>[] = [];
  const passo = 1000;
  for (let inicio = 0; inicio < 50000; inicio += passo) {
    let consulta = supabase
      .from("contatos")
      .select("username, email, whatsapp, segue, ultima_interacao, criado_em")
      .order("criado_em", { ascending: false })
      .range(inicio, inicio + passo - 1);
    if (soLeads) consulta = consulta.or("email.not.is.null,whatsapp.not.is.null");
    const { data } = await consulta;
    linhas.push(...(data ?? []));
    if (!data || data.length < passo) break;
  }

  const cabecalho = ["Instagram", "E-mail", "WhatsApp", "Segue", "Última interação", "Primeiro contato"];
  const corpo = linhas.map((c) =>
    [
      c.username ? `@${c.username}` : "",
      c.email,
      c.whatsapp,
      c.segue === true ? "Sim" : c.segue === false ? "Não" : "",
      c.ultima_interacao ? new Date(String(c.ultima_interacao)).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "",
      c.criado_em ? new Date(String(c.criado_em)).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "",
    ]
      .map(celula)
      .join(";"),
  );

  // BOM + ";" para abrir certinho no Excel em português.
  const csv = "﻿" + [cabecalho.map(celula).join(";"), ...corpo].join("\r\n");
  const data = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="contatos-responde-ai-${data}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
