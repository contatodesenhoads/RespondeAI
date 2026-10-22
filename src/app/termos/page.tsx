import { PaginaLegal } from "@/components/PaginaLegal";

export const metadata = { title: "Termos de uso · Responde AI" };

// Rascunho: revisar com o jurídico e preencher os campos entre colchetes.
export default function Termos() {
  return (
    <PaginaLegal titulo="Termos de uso" atualizado="[data]">
      <p>
        Estes termos regem o uso do Responde AI, serviço da Desenho Ads ([razão social], CNPJ [CNPJ]). Ao usar o
        serviço, você concorda com eles.
      </p>
      <h2>O serviço</h2>
      <p>
        O Responde AI responde comentários e envia mensagens no direct de uma conta profissional do Instagram, de acordo
        com as automações configuradas pelo cliente, usando a API oficial da Meta.
      </p>
      <h2>Responsabilidades do cliente</h2>
      <ul>
        <li>Ser titular ou ter autorização para gerenciar a conta do Instagram conectada.</li>
        <li>Criar mensagens e conteúdos lícitos, que respeitem as Políticas da Meta e os direitos de terceiros.</li>
        <li>Não usar o serviço para spam, disparo em massa ou para contatar quem não interagiu com a conta.</li>
      </ul>
      <h2>Limites</h2>
      <p>
        O funcionamento depende da plataforma da Meta, que pode mudar regras, limitar envios ou ficar indisponível. Não
        garantimos resultados de engajamento ou vendas.
      </p>
      <h2>Planos e cancelamento</h2>
      <p>[Condições de pagamento, renovação e cancelamento.]</p>
      <h2>Contato</h2>
      <p>[e-mail de contato]</p>
    </PaginaLegal>
  );
}
