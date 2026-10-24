"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { criarCliente, type EstadoNovoCliente } from "@/app/admin/acoes";
import { CopiarLink } from "@/components/CopiarLink";
import type { Plano } from "@/lib/planos";

const campo = "h-[46px] w-full rounded-[10px] border border-campo bg-white px-3.5 text-[15px] text-tinta";
const rotulo = "text-sm font-semibold";

export function FormNovoCliente({ planos }: { planos: Plano[] }) {
  const [estado, acao, enviando] = useActionState<EstadoNovoCliente, FormData>(criarCliente, {});
  const [plano, setPlano] = useState("essencial");
  const [entrega, setEntrega] = useState<"link" | "email">("link");

  if (estado.clienteId || estado.link || estado.emailEnviado) {
    return (
      <section className="flex max-w-[640px] flex-col gap-4 rounded-[14px] border border-linha bg-white p-6">
        <h2 className="text-xl font-bold text-ok">Cliente criado!</h2>
        {estado.link && (
          <>
            <p className="text-[15px] text-tinta-2">Envie o link abaixo para o cliente. Ao abrir, ele cria a senha e já entra no Responde AI.</p>
            <CopiarLink
              link={estado.link}
              mensagem="Olá! Seu acesso ao Responde AI está pronto. Clique no link para criar sua senha e entrar:"
            />
          </>
        )}
        {estado.emailEnviado && (
          <p className="text-[15px] text-tinta-2">
            Enviamos o convite para <b>{estado.emailEnviado}</b>. Se não chegar em alguns minutos, gere um link de acesso na página do cliente.
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          {estado.clienteId && (
            <Link href={`/admin/clientes/${estado.clienteId}`} className="flex h-11 items-center rounded-[10px] border border-campo bg-white px-4 text-sm font-semibold text-tinta no-underline">
              Ver cliente
            </Link>
          )}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex h-11 items-center rounded-[10px] bg-marsala px-4 text-sm font-semibold text-off hover:bg-marsala-escuro"
          >
            Cadastrar outro
          </button>
        </div>
      </section>
    );
  }

  return (
    <form action={acao} className="flex max-w-[640px] flex-col gap-4">
      <section className="flex flex-col gap-3.5 rounded-[14px] border border-linha bg-white p-6">
        <h2 className="text-[17px] font-bold">Dados do cliente</h2>
        <label htmlFor="empresa" className={rotulo}>Nome da empresa</label>
        <input id="empresa" name="empresa" required maxLength={120} placeholder="Ex.: Oliveira Móveis" className={campo} />
        <label htmlFor="nome" className={rotulo}>Nome do responsável</label>
        <input id="nome" name="nome" maxLength={120} placeholder="Quem vai usar o sistema" className={campo} />
        <label htmlFor="email" className={rotulo}>E-mail de acesso</label>
        <input id="email" name="email" type="email" required placeholder="cliente@empresa.com.br" className={campo} />
      </section>

      <section className="flex flex-col gap-3.5 rounded-[14px] border border-linha bg-white p-6">
        <h2 className="text-[17px] font-bold">Plano</h2>
        <input type="hidden" name="plano" value={plano} />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3">
          {planos.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={plano === p.id}
              onClick={() => setPlano(p.id)}
              className={`flex flex-col gap-1 rounded-xl p-4 text-left ${plano === p.id ? "border-2 border-marsala bg-[#FBF7F7]" : "border border-linha bg-white"}`}
            >
              <span className="text-[15px] font-bold">{p.nome}</span>
              <span className="text-sm font-semibold text-marsala">
                {p.precoMensal ? `R$ ${p.precoMensal.toFixed(2).replace(".", ",")}/mês` : "Sem cobrança"}
              </span>
              <span className="text-[13px] leading-snug text-suave">{p.descricao}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3.5 rounded-[14px] border border-linha bg-white p-6">
        <h2 className="text-[17px] font-bold">Como entregar o acesso</h2>
        <input type="hidden" name="entrega" value={entrega} />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={entrega === "link"}
            onClick={() => setEntrega("link")}
            className={`h-11 rounded-full border px-[18px] text-sm ${entrega === "link" ? "border-marsala bg-marsala font-semibold text-off" : "border-campo bg-white font-medium"}`}
          >
            Gerar link (enviar pelo WhatsApp)
          </button>
          <button
            type="button"
            aria-pressed={entrega === "email"}
            onClick={() => setEntrega("email")}
            className={`h-11 rounded-full border px-[18px] text-sm ${entrega === "email" ? "border-marsala bg-marsala font-semibold text-off" : "border-campo bg-white font-medium"}`}
          >
            Enviar convite por e-mail
          </button>
        </div>
        <p className="text-[13px] text-suave">
          {entrega === "link"
            ? "Você recebe um link pessoal para mandar ao cliente. Funciona sempre, sem depender do envio de e-mail."
            : "O cliente recebe o e-mail de boas-vindas da Desenho Ads com o botão para criar a senha."}
        </p>
      </section>

      <section className="flex flex-col gap-3.5 rounded-[14px] border border-linha bg-white p-6">
        <label htmlFor="observacoes" className="text-[17px] font-bold">Observações internas (opcional)</label>
        <textarea id="observacoes" name="observacoes" rows={3} maxLength={2000} placeholder="Ex.: cliente piloto, indicado por…" className="rounded-[10px] border border-campo bg-white px-3.5 py-3 text-[15px]" />
        <p className="text-[13px] text-suave">Só a equipe da Desenho Ads vê.</p>
      </section>

      {estado.erro && <p role="alert" className="rounded-xl bg-erro-fundo px-4 py-3 text-sm text-erro">{estado.erro}</p>}

      <div className="flex flex-wrap justify-end gap-3">
        <Link href="/admin/clientes" className="flex h-12 items-center px-3 text-[15px] font-semibold">Cancelar</Link>
        <button type="submit" disabled={enviando} className="h-12 rounded-[10px] bg-marsala px-[22px] text-[15px] font-semibold text-off hover:bg-marsala-escuro disabled:opacity-60">
          {enviando ? "Criando…" : "Criar cliente"}
        </button>
      </div>
    </form>
  );
}
