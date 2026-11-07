import { getRequestConfig } from "next-intl/server";
import { GAME_TIME_ZONE } from "@/lib/time";
import { defaultLocale } from "./config";

// Sem prefixo na URL: por enquanto o idioma é sempre o padrão. Pra um segundo idioma,
// escolha o locale aqui (cookie ou Accept-Language) e adicione messages/<locale>.json.
export default getRequestConfig(async () => {
  const locale = defaultLocale;
  return {
    locale,
    timeZone: GAME_TIME_ZONE,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
