// Links de acesso circulam por WhatsApp e e-mail e às vezes ganham "sujeira"
// no fim (ponto final, vírgula, parêntese, espaço). Aqui limpamos tudo isso,
// para o link funcionar mesmo assim.

const TIPOS = ["invite", "recovery", "magiclink", "signup", "email"];
const DESTINOS = ["/definir-senha", "/"];

export function limparLinkDeAcesso(p: { token_hash?: string; type?: string; next?: string }) {
  // O código do link só tem letras, números, "-" e "_".
  const tokenHash = (p.token_hash ?? "").replace(/[^A-Za-z0-9_-]/g, "");
  const tipoBruto = (p.type ?? "").toLowerCase().replace(/[^a-z]/g, "");
  const tipo = TIPOS.includes(tipoBruto) ? tipoBruto : null;
  // Destino só entre os caminhos conhecidos; qualquer outra coisa vai para a criação de senha.
  const nextLimpo = (p.next ?? "").trim().replace(/[^A-Za-z/-]+$/g, "");
  const destino = DESTINOS.includes(nextLimpo) ? nextLimpo : "/definir-senha";
  return { tokenHash, tipo, destino };
}
