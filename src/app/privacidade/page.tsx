import { PaginaLegal } from "@/components/PaginaLegal";

export const metadata = { title: "Política de privacidade · Responde AI" };

export default function Privacidade() {
  return (
    <PaginaLegal titulo="Política de privacidade" atualizado="22 de outubro de 2026">
      <p>
        O Responde AI é um serviço da Desenho Ads (Delon Louis Chauvin, CNPJ 43.781.989/0001-20, Itajaí/SC) que automatiza respostas
        a comentários e mensagens no Instagram de empresas e profissionais. Esta política explica quais dados
        tratamos, para quê e como você pode pedir a exclusão.
      </p>

      <h2>Quais dados tratamos</h2>
      <ul>
        <li>Dados da conta do Responde AI: nome, e-mail e senha (guardada de forma criptografada).</li>
        <li>
          Dados da conta profissional do Instagram conectada: identificador, nome de usuário e a autorização de acesso
          concedida pelo Instagram. Não recebemos a sua senha do Instagram.
        </li>
        <li>
          Dados de quem interage com as automações: identificador e nome de usuário no Instagram, texto do comentário
          ou mensagem que acionou a automação, se a pessoa segue o perfil e os passos da automação (clique no botão,
          entrega do conteúdo, clique no link).
        </li>
      </ul>

      <h2>Para que usamos</h2>
      <ul>
        <li>Responder comentários e enviar mensagens no direct conforme as automações criadas pelo cliente.</li>
        <li>Verificar se a pessoa segue o perfil, quando a automação exige isso.</li>
        <li>Mostrar ao cliente os números das automações no painel (dashboard).</li>
      </ul>
      <p>Não vendemos dados, não publicamos nada no perfil conectado e não usamos os dados para anúncios.</p>

      <h2>Permissões do Instagram</h2>
      <p>
        Usamos apenas as permissões instagram_business_basic, instagram_business_manage_comments e
        instagram_business_manage_messages, concedidas pelo próprio titular da conta na tela oficial do Instagram.
      </p>

      <h2>Armazenamento e segurança</h2>
      <p>
        Os dados ficam em servidores de nuvem contratados pela Desenho Ads. As autorizações de acesso ao Instagram são
        guardadas criptografadas e usadas só pelo servidor. Cada cliente acessa apenas os próprios dados.
      </p>

      <h2>Por quanto tempo guardamos</h2>
      <p>
        Enquanto a conta estiver ativa. Ao desconectar o Instagram ou encerrar a conta, a autorização de acesso é
        apagada; o histórico de interações é apagado em até 30 dias ou imediatamente, a pedido.
      </p>

      <h2>Seus direitos e exclusão de dados</h2>
      <p>
        Você pode pedir acesso, correção ou exclusão dos seus dados, conforme a LGPD, pelo e-mail <a href="mailto:contatodesenhoads@gmail.com">contatodesenhoads@gmail.com</a>.
        Também pode remover o Responde AI a qualquer momento no Instagram, em Configurações › Apps e sites: nesse caso,
        apagamos a autorização e os dados ligados à conta. Veja também a página{" "}
        <a href="/exclusao-de-dados">Exclusão de dados</a>.
      </p>

      <h2>Contato</h2>
      <p>Responsável pelo tratamento de dados: Delon Louis Chauvin (Desenho Ads) · <a href="mailto:contatodesenhoads@gmail.com">contatodesenhoads@gmail.com</a>.</p>
    </PaginaLegal>
  );
}
