const COMBINING_DIACRITICS = /[̀-ͯ]/g;

/**
 * Sanitiza um nome de arquivo para uso seguro como chave de objeto no
 * Supabase Storage. O Storage rejeita (400 Bad Request) chaves com
 * caracteres não-ASCII (acentos, cedilha, etc.) ou determinados símbolos.
 *
 * Normaliza removendo acentos, troca espaços/caracteres especiais por "-"
 * e preserva a extensão original em minúsculas.
 */
export function sanitizeFileName(nomeOriginal: string): string {
  const ultimoPonto = nomeOriginal.lastIndexOf(".");
  const temExtensao = ultimoPonto > 0 && ultimoPonto < nomeOriginal.length - 1;
  const base = temExtensao ? nomeOriginal.slice(0, ultimoPonto) : nomeOriginal;
  const extensao = temExtensao ? nomeOriginal.slice(ultimoPonto + 1) : "";

  const baseSanitizada = base
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS, "") // remove acentos (marcas diacríticas combinantes)
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  const extensaoSanitizada = extensao
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS, "")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .toLowerCase();

  const nomeFinal = baseSanitizada || "arquivo";
  return extensaoSanitizada ? `${nomeFinal}.${extensaoSanitizada}` : nomeFinal;
}

/**
 * Monta um caminho de upload único e seguro para o Storage:
 * `<prefixo>/<timestamp>-<nome-sanitizado>`.
 */
export function buildStorageUploadPath(prefixo: string, arquivo: File): string {
  return `${prefixo}/${Date.now()}-${sanitizeFileName(arquivo.name)}`;
}
