/** URL pública do site, pra links de compartilhar e prévias. */
export function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/** Data "YYYY-MM-DD" como instante ao meio-dia UTC, seguro pra formatar no fuso de Brasília. */
export function dateFromIso(iso: string): Date {
  return new Date(`${iso}T12:00:00Z`);
}
