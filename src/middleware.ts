import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rotas que não exigem login.
const PUBLICAS = ["/login", "/auth/", "/privacidade", "/termos", "/exclusao-de-dados", "/api", "/l/"];

export async function middleware(request: NextRequest) {
  // Endereço colado com pontuação no fim (ex.: "/definir-senha."): corrige e redireciona.
  const semPontuacao = request.nextUrl.pathname.replace(/[.,;:!?)\]'"]+$/, "");
  if (semPontuacao !== request.nextUrl.pathname && semPontuacao.length > 0) {
    const url = request.nextUrl.clone();
    url.pathname = semPontuacao;
    return NextResponse.redirect(url);
  }

  let resposta = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(lista) {
          lista.forEach(({ name, value }) => request.cookies.set(name, value));
          resposta = NextResponse.next({ request });
          lista.forEach(({ name, value, options }) =>
            resposta.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const caminho = request.nextUrl.pathname;
  const publica = PUBLICAS.some((p) => caminho.startsWith(p));

  if (!user && !publica) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && caminho === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return resposta;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo-desenho-ads.png).*)"],
};
