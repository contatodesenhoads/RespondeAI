import { NextResponse, type NextRequest } from "next/server";
import { supabaseServidor } from "@/lib/supabase/server";

// Retorno do link enviado por e-mail (ex.: criar nova senha).
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const destino = request.nextUrl.searchParams.get("next") ?? "/inicio";
  const seguro = destino.startsWith("/") && !destino.startsWith("//") ? destino : "/inicio";

  if (code) {
    const supabase = await supabaseServidor();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL(seguro, request.nextUrl.origin));
}
