import { PaginaLegal } from "@/components/PaginaLegal";

export const metadata = { title: "Exclusão de dados · Responde AI" };

export default async function ExclusaoDeDados({ searchParams }: { searchParams: Promise<{ codigo?: string }> }) {
  const { codigo } = await searchParams;
  return (
    <PaginaLegal titulo="Exclusão de dados" atualizado="[data]">
      {codigo ? (
        <p className="rounded-xl bg-ok-fundo px-4 py-3 text-ok">
          Seu pedido foi recebido e os dados ligados à sua conta do Instagram foram apagados. Código de confirmação:{" "}
          <b>{codigo}</b>.
        </p>
      ) : null}
      <p>Você pode apagar os seus dados do Responde AI de três formas:</p>
      <ul>
        <li>No Instagram: Configurações › Apps e sites › remova o Responde AI e peça a exclusão dos dados.</li>
        <li>No painel do Responde AI: Configurações › Desconectar Instagram.</li>
        <li>Por e-mail: escreva para [e-mail de contato] pedindo a exclusão.</li>
      </ul>
      <p>
        Apagamos a autorização de acesso ao Instagram, os contatos e o histórico de interações ligados à conta.
      </p>
    </PaginaLegal>
  );
}
