# Responde AI

Automação de comentários e direct do Instagram. Um produto Desenho Ads.

Quem comenta a palavra-chave num post recebe uma mensagem no direct com um botão; o sistema confere se a
pessoa segue o perfil (pedindo para seguir e clicar em "Já segui", se for o caso) e entrega o conteúdo.

## Tecnologia

- **Next.js 15** (App Router, TypeScript, Tailwind) hospedado na **Vercel**
- **Supabase**: banco de dados (Postgres com regras de acesso por cliente) e login
- **API oficial do Instagram** (login com Instagram, webhooks de comentários e mensagens)

## Estrutura

| Caminho | O que é |
| --- | --- |
| `supabase/schema.sql` | Tabelas, regras de acesso e funções. Rodar uma vez no SQL Editor do Supabase |
| `src/app/login` | Tela de login |
| `src/app/conectar-instagram` | Tela de primeiro acesso / reconexão |
| `src/app/(painel)/*` | Início, Automações, Contatos, Dashboard, Configurações |
| `src/app/api/instagram/*` | Conexão (OAuth), cancelamento de autorização e exclusão de dados |
| `src/app/api/webhooks/instagram` | Recebe os avisos da Meta (comentários, mensagens, cliques) |
| `src/app/api/cron/renovar-tokens` | Renovação diária dos tokens (vercel.json) |
| `src/app/l/[automacao]` | Link rastreável da entrega |
| `src/lib/motor.ts` | Regras das automações |
| `src/lib/instagram.ts` | Chamadas à API do Instagram |

## Configuração

1. Supabase › SQL Editor › colar e rodar `supabase/schema.sql`.
2. Vercel › importar o repositório › cadastrar as variáveis de `.env.example`.
3. Meta › app › Instagram › cadastrar:
   - URL de redirecionamento: `<site>/api/instagram/callback`
   - Webhook: `<site>/api/webhooks/instagram` com o mesmo `META_WEBHOOK_VERIFY_TOKEN`; campos `comments`, `messages`, `messaging_postbacks`
   - Cancelar autorização: `<site>/api/instagram/desautorizar`
   - Exclusão de dados: `<site>/api/instagram/excluir-dados`
   - Política de privacidade: `<site>/privacidade`
4. Criar usuários em Supabase › Authentication › Add user. O cliente e o perfil são criados sozinhos.
   Para tornar alguém administrador da agência: `update perfis set papel = 'admin' where id = '<id do usuário>';`

## Rodar localmente

```bash
npm install
cp .env.example .env.local   # preencher
npm run dev
```
