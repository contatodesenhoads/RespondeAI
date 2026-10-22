import { supabaseServidor } from "@/lib/supabase/server";
import { tempoRelativo } from "@/lib/estatisticas";
import { Cabecalho, Vazio } from "@/components/ui";

export const metadata = { title: "Contatos · Responde AI" };
export const dynamic = "force-dynamic";

export default async function Contatos() {
  const supabase = await supabaseServidor();
  const { data } = await supabase
    .from("contatos")
    .select("id, username, segue, ultima_interacao")
    .order("ultima_interacao", { ascending: false })
    .limit(200);

  const lista = data ?? [];
  const th = "border-b border-linha px-5 py-4 font-semibold";
  const td = "border-b border-linha-2 px-5 py-4";

  return (
    <>
      <Cabecalho titulo="Contatos" subtitulo="Pessoas que interagiram com as suas automações" />
      {lista.length === 0 ? (
        <Vazio titulo="Nenhum contato ainda" texto="Quem comentar a palavra-chave de uma automação aparece aqui." />
      ) : (
        <div className="overflow-x-auto rounded-[14px] border border-linha bg-white">
          <table className="w-full min-w-[560px] border-collapse text-[15px]">
            <thead>
              <tr className="text-left text-[13px] text-suave">
                <th className={th}>Perfil</th>
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
                  <td className={td}>{c.segue === true ? "Sim" : c.segue === false ? "Não" : "—"}</td>
                  <td className={`${td} text-suave`}>{tempoRelativo(c.ultima_interacao)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
