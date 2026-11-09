"use server";

import { redirect } from "next/navigation";
import { setPlayerName } from "@/lib/account/link";
import { appDb } from "@/lib/app-db";
import { cleanName } from "@/lib/avatar";
import { getViewer } from "@/lib/player";
import { safeNext } from "@/lib/supabase/config";

/** Salva o nome do jogador da conta (primeiro login ou edição no perfil). */
export async function saveNameAction(formData: FormData) {
  const next = safeNext(String(formData.get("next") ?? ""), "/perfil");
  const from = String(formData.get("from") ?? "") === "bem-vindo" ? "bem-vindo" : "perfil";
  const viewer = await getViewer();
  if (!viewer.account || !viewer.playerId) redirect(`/entrar?next=${encodeURIComponent(next)}`);
  const name = cleanName(formData.get("name"));
  if (!name) redirect(from === "bem-vindo" ? `/bem-vindo?erro=1&next=${encodeURIComponent(next)}` : "/perfil?erro=nome");
  await setPlayerName(appDb().exec, viewer.playerId, name);
  redirect(from === "bem-vindo" ? next : "/perfil?salvo=1");
}
