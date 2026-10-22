// Leitura centralizada das variáveis de ambiente.
// As chaves secretas ficam só no servidor (Vercel) e nunca vão para o navegador.

function obrigatoria(nome: string): string {
  const valor = process.env[nome];
  if (!valor) {
    throw new Error(`Variável de ambiente ausente: ${nome}`);
  }
  return valor;
}

export const env = {
  supabaseUrl: () => obrigatoria("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: () => obrigatoria("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceKey: () => obrigatoria("SUPABASE_SERVICE_ROLE_KEY"),
  siteUrl: () => obrigatoria("NEXT_PUBLIC_SITE_URL").replace(/\/$/, ""),
  instagramAppId: () => obrigatoria("INSTAGRAM_APP_ID"),
  instagramAppSecret: () => obrigatoria("INSTAGRAM_APP_SECRET"),
  webhookVerifyToken: () => obrigatoria("META_WEBHOOK_VERIFY_TOKEN"),
  tokenEncryptionKey: () => obrigatoria("TOKEN_ENCRYPTION_KEY"),
  cronSecret: () => obrigatoria("CRON_SECRET"),
  graphVersion: () => process.env.GRAPH_API_VERSION || "v23.0",
};
