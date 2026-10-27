// Defesa CSRF adicional ao SameSite: metodos que alteram estado so aceitam
// requisicoes cuja origem (Origin) esteja na lista permitida.
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function isOriginAllowed(
  method: string,
  originHeader: string | undefined,
  allowedOrigins: string[],
): boolean {
  if (SAFE_METHODS.has(method.toUpperCase())) return true;
  if (!originHeader) return false;
  return allowedOrigins.includes(originHeader);
}
