import { supabaseServidor } from "@/lib/supabase/server";
import { tempoRelativo } from "@/lib/estatisticas";
import { Cabecalho, Vazio } from "@/components/ui";

export const metadata = { title: "Contatos · Responde AI" };
export const dynamic = "force-dynamic";

function whatsappLegivel(n: string) {
  const d = n.replace(/^55/, "");
  return d.length === 11 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : d.length === 10 ? `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}` : n;
}

export default async function Contatos({ searchParams }: { searchParams: Promise<{ filtro?: string }> }) {
  const { filtro } = await searchParams;
  const soLeads = filtro === "leads";
  const supabase = await supabaseServidor();
  let consulta = supabase
    .from("contatos")
    .select("id, username, segue, email, whatsapp, ultima_interacao")
    .order("ultima_interacao", { ascending: false })
    .limit(500);
  if (soLeads) consulta = consulta.or("email.not.is.null,whatsapp.not.is.null");
  const { data } = await consulta;

  const lista = data ?? [];
  const th = "border-b border-linha px-5 py-4 font-semibold";
  const td = "border-b border-linha-2 px-5 py-4";
  const pilula = (ativo: boolean) =>
    `flex h-11 items-center rounded-full border px-4 text-sm no-underline ${
      ativo ? "border-marsala bg-marsala font-semibold text-off hover:text-off" : "border-campo bg-white font-medium text-tinta hover:text-tinta"
    }`;

  return (
    <>
      <Cabecalho
        titulo="Contatos"
        subtitulo="Pessoas que interagiram com as suas automações"
        acao={
          <a
            href={`/contatos/exportar${soLeads ? "?filtro=leads" : ""}`}
            className="flex h-[46px] items-center gap-2 rounded-[10px] border border-campo bg-white px-5 text-[15px] font-semibold text-tinta no-underline hover:text-tinta"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
            </svg>
            Exportar planilha
          </a>
        }
      />

      <div className="flex flex-wrap gap-2">
        <a href="/contatos" aria-current={!soLeads ? "true" : undefined} className={pilula(!soLeads)}>Todos</a>
        <a href="/contatos?filtro=leads" aria-current={soLeads ? "true" : undefined} className={pilula(soLeads)}>Com e-mail ou WhatsApp</a>
      </div>

      {lista.length === 0 ? (
        <Vazio
          titulo={soLeads ? "Nenhum lead ainda" : "Nenhum contato ainda"}
          texto={
            soLeads
              ? "Ative “Pedir e-mail ou WhatsApp” numa automação para os contatos aparecerem aqui."
              : "Quem comentar a palavra-chave de uma automação aparece aqui."
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-[14px] border border-linha bg-white">
          <table className="w-full min-w-[760px] border-collapse text-[15px]">
            <thead>
              <tr className="text-left text-[13px] text-suave">
                <th className={th}>Perfil</th>
                <th className={th}>E-mail</th>
                <th className={th}>WhatsApp</th>
                <th className={th}>Segue você</th>
                <th className={th}>Última interação</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((c) => (
                <tr key={c.id}>
                  <td className={`${td} font-semibold`}>
                    {c.username ? (
                      <a href={`https://instagram.com/${c.username}`} target="_blank" rel="noreferrer">@{c.username}</a>
                    ) : (
                      "Perfil sem nome disponível"
                    )}
                  </td>
                  <td className={td}>{c.email ?? <span className="text-suave">—</span>}</td>
                  <td className={td}>
                    {c.whatsapp ? (
                      <a href={`https://wa.me/${c.whatsapp}`} target="_blank" rel="noreferrer">{whatsappLegivel(c.whatsapp)}</a>
                    ) : (
                      <span className="text-suave">—</span>
                    )}
                  </td>
                  <td className={td}>{c.segue === true ? "Sim" : c.segue === false ? "Não" : "—"}</td>
                  <td className={`${td} text-suave`}>{tempoRelativo(c.ultima_interacao)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {lista.length === 500 && <p className="text-[13px] text-suave">Mostrando os 500 mais recentes. A planilha traz todos.</p>}
    </>
  );
}
