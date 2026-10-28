// Regras das mídias de entrega (usadas na tela e no servidor).
// Limites do Instagram: imagem 8 MB; vídeo, áudio e PDF 25 MB.

export type TipoMidia = "image" | "video" | "audio" | "file";

export const MB = 1024 * 1024;
export const LIMITE_IMAGEM = 8 * MB;
export const LIMITE_ARQUIVO = 25 * MB;
export const COTA_POR_CLIENTE = 500 * MB; // soma das mídias de todas as automações do cliente

export const BUCKET_MIDIAS = "entregas";

const MIME_PARA_TIPO: Record<string, TipoMidia> = {
  "image/jpeg": "image",
  "image/png": "image",
  "video/mp4": "video",
  "video/quicktime": "video",
  "video/webm": "video",
  "audio/mpeg": "audio",
  "audio/mp4": "audio",
  "audio/aac": "audio",
  "audio/wav": "audio",
  "audio/x-wav": "audio",
  "audio/x-m4a": "audio",
  "audio/m4a": "audio",
  "application/pdf": "file",
};

export const ACEITOS = Object.keys(MIME_PARA_TIPO).join(",") + ",.m4a,.pdf";

export function tipoDaMidia(mime: string, nome = ""): TipoMidia | null {
  if (MIME_PARA_TIPO[mime]) return MIME_PARA_TIPO[mime];
  const ext = nome.toLowerCase().split(".").pop();
  if (ext === "m4a" || ext === "aac" || ext === "wav") return "audio";
  if (ext === "pdf") return "file";
  if (ext === "mp3") return "audio";
  if (ext === "mp4" || ext === "mov" || ext === "webm") return "video";
  if (ext === "jpg" || ext === "jpeg" || ext === "png") return "image";
  return null;
}

// Tipo informado ao armazenamento. Alguns navegadores não informam o tipo de
// .m4a/.pdf; nesse caso, deduz pela extensão.
export function mimeDoArquivo(arquivo: { type: string; name: string }) {
  if (arquivo.type && MIME_PARA_TIPO[arquivo.type]) return arquivo.type;
  const ext = arquivo.name.toLowerCase().split(".").pop();
  const porExtensao: Record<string, string> = {
    pdf: "application/pdf",
    m4a: "audio/mp4",
    aac: "audio/aac",
    wav: "audio/wav",
    mp3: "audio/mpeg",
    mp4: "video/mp4",
    mov: "video/quicktime",
    webm: "video/webm",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
  };
  return porExtensao[ext ?? ""] ?? arquivo.type ?? "application/octet-stream";
}

export function limiteDoTipo(tipo: TipoMidia) {
  return tipo === "image" ? LIMITE_IMAGEM : LIMITE_ARQUIVO;
}

export const NOME_TIPO: Record<TipoMidia, string> = {
  image: "Imagem",
  video: "Vídeo",
  audio: "Áudio",
  file: "PDF",
};

export function tamanhoLegivel(bytes: number) {
  if (bytes >= MB) return `${(bytes / MB).toFixed(1).replace(".", ",")} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

// Nome de arquivo seguro para o caminho no armazenamento.
export function nomeSeguro(nome: string) {
  const limpo = nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(-80);
  return limpo || "arquivo";
}
