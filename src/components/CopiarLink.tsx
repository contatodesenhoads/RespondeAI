"use client";

import { useState } from "react";

// Mostra um link de acesso com botão de copiar e atalho para o WhatsApp.
export function CopiarLink({ link, mensagem }: { link: string; mensagem?: string }) {
  const [copiado, setCopiado] = useState(false);
  const texto = mensagem ? `${mensagem}\n\n${link}` : link;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-linha bg-off-2 p-4">
      <label className="text-sm font-semibold" htmlFor="link-acesso">Link de acesso</label>
      <input
        id="link-acesso"
        readOnly
        value={link}
        onFocus={(e) => e.currentTarget.select()}
        className="h-11 w-full rounded-[10px] border border-campo bg-white px-3 text-[13px] text-tinta-2"
      />
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={copiar} className="h-11 rounded-[10px] bg-marsala px-4 text-sm font-semibold text-off hover:bg-marsala-escuro">
          {copiado ? "Copiado!" : mensagem ? "Copiar mensagem com o link" : "Copiar link"}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(texto)}`}
          target="_blank"
          rel="noreferrer"
          className="flex h-11 items-center rounded-[10px] border border-campo bg-white px-4 text-sm font-semibold text-tinta no-underline hover:text-tinta"
        >
          Enviar pelo WhatsApp
        </a>
      </div>
      <p className="text-[13px] text-suave">
        O link é pessoal e vale por tempo limitado. Se expirar, gere um novo na página do cliente.
      </p>
    </div>
  );
}
