"use client";

import { createBrowserClient } from "@supabase/ssr";

// Cliente do Supabase para o navegador (só a chave pública).
export function supabaseNavegador() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
