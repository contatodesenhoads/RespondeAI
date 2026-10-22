import "server-only";
import { env } from "@/lib/env";

// Integração com a API oficial do Instagram (login com Instagram).
// Documentação: developers.facebook.com/docs/instagram-platform

export const PERMISSOES = [
  "instagram_business_basic",
  "instagram_business_manage_comments",
  "instagram_business_manage_messages",
];

const graph = () => `https://graph.instagram.com/${env.graphVersion()}`;
export const redirectUri = () => `${env.siteUrl()}/api/instagram/callback`;

export class ErroInstagram extends Error {
  constructor(
    mensagem: string,
    public detalhe?: unknown,
  ) {
    super(mensagem);
  }
}

async function lerResposta<T>(r: Response, contexto: string): Promise<T> {
  const corpo = await r.json().catch(() => ({}));
  if (!r.ok || (corpo && corpo.error)) {
    throw new ErroInstagram(`Instagram: falha em ${contexto}`, corpo);
  }
  return corpo as T;
}

// ---------------------------------------------------------------------
// Conexão da conta (OAuth)
// ---------------------------------------------------------------------

export function urlAutorizacao(state: string) {
  const p = new URLSearchParams({
    client_id: env.instagramAppId(),
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: PERMISSOES.join(","),
    state,
  });
  return `https://www.instagram.com/oauth/authorize?${p.toString()}`;
}

export async function trocarCodigoPorToken(code: string) {
  const corpo = new URLSearchParams({
    client_id: env.instagramAppId(),
    client_secret: env.instagramAppSecret(),
    grant_type: "authorization_code",
    redirect_uri: redirectUri(),
    code,
  });
  const r = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    body: corpo,
  });
  const dados = await lerResposta<{ access_token: string; user_id: number | string }>(
    r,
    "trocar o código pelo token",
  );
  return { token: dados.access_token, userId: String(dados.user_id) };
}

export async function tokenDeLongaDuracao(tokenCurto: string) {
  const p = new URLSearchParams({
    grant_type: "ig_exchange_token",
    client_secret: env.instagramAppSecret(),
    access_token: tokenCurto,
  });
  const r = await fetch(`https://graph.instagram.com/access_token?${p.toString()}`);
  const dados = await lerResposta<{ access_token: string; expires_in: number }>(
    r,
    "gerar o token de longa duração",
  );
  return { token: dados.access_token, expiraEmSegundos: dados.expires_in };
}

export async function renovarToken(token: string) {
  const p = new URLSearchParams({ grant_type: "ig_refresh_token", access_token: token });
  const r = await fetch(`https://graph.instagram.com/refresh_access_token?${p.toString()}`);
  const dados = await lerResposta<{ access_token: string; expires_in: number }>(
    r,
    "renovar o token",
  );
  return { token: dados.access_token, expiraEmSegundos: dados.expires_in };
}

export async function minhaConta(token: string) {
  const r = await fetch(`${graph()}/me?fields=user_id,username&access_token=${encodeURIComponent(token)}`);
  const dados = await lerResposta<{ user_id: string; username: string; id: string }>(
    r,
    "ler os dados da conta",
  );
  return { igUserId: String(dados.user_id ?? dados.id), username: dados.username };
}

// Inscreve a conta para a Meta avisar o servidor sobre comentários e mensagens.
export async function inscreverWebhooks(token: string) {
  const p = new URLSearchParams({
    subscribed_fields: "comments,messages,messaging_postbacks",
    access_token: token,
  });
  const r = await fetch(`${graph()}/me/subscribed_apps?${p.toString()}`, { method: "POST" });
  return lerResposta<{ success: boolean }>(r, "ativar os avisos (webhooks)");
}

// ---------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------

export type Post = {
  id: string;
  caption?: string;
  media_type: string;
  media_product_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp: string;
};

export async function listarPosts(token: string, limite = 12): Promise<Post[]> {
  const campos = "id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp";
  const r = await fetch(
    `${graph()}/me/media?fields=${campos}&limit=${limite}&access_token=${encodeURIComponent(token)}`,
    { cache: "no-store" },
  );
  const dados = await lerResposta<{ data: Post[] }>(r, "listar os posts");
  return dados.data ?? [];
}

// ---------------------------------------------------------------------
// Comentários e mensagens
// ---------------------------------------------------------------------

async function post(caminho: string, token: string, corpo: unknown, contexto: string) {
  const r = await fetch(`${graph()}${caminho}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(corpo),
  });
  return lerResposta<Record<string, unknown>>(r, contexto);
}

export function responderComentarioPublico(token: string, comentarioId: string, texto: string) {
  return post(`/${comentarioId}/replies`, token, { message: texto }, "responder o comentário");
}

export type Botao = { titulo: string; payload: string };

export function mensagemComBotoes(texto: string, botoes: Botao[]) {
  return {
    attachment: {
      type: "template",
      payload: {
        template_type: "button",
        text: texto.slice(0, 640),
        buttons: botoes.slice(0, 3).map((b) => ({
          type: "postback",
          title: b.titulo.slice(0, 20),
          payload: b.payload,
        })),
      },
    },
  };
}

// Resposta privada: a primeira mensagem no direct para quem comentou.
// A Meta permite uma única mensagem por comentário, em até 7 dias.
export function respostaPrivada(token: string, comentarioId: string, mensagem: unknown) {
  return post("/me/messages", token, { recipient: { comment_id: comentarioId }, message: mensagem }, "enviar a resposta privada");
}

export function enviarMensagem(token: string, igsid: string, mensagem: unknown) {
  return post("/me/messages", token, { recipient: { id: igsid }, message: mensagem }, "enviar a mensagem");
}

// Perfil de quem interagiu. A Meta só libera depois que a pessoa
// mandou mensagem ou clicou num botão (consentimento).
export async function perfilDoContato(token: string, igsid: string) {
  const r = await fetch(
    `${graph()}/${igsid}?fields=username,is_user_follow_business&access_token=${encodeURIComponent(token)}`,
    { cache: "no-store" },
  );
  const dados = await lerResposta<{ username?: string; is_user_follow_business?: boolean }>(
    r,
    "consultar se a pessoa segue o perfil",
  );
  return { username: dados.username, segue: dados.is_user_follow_business === true };
}
