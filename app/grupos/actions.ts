"use server";

import { redirect } from "next/navigation";
import { appDb } from "@/lib/app-db";
import { cleanGroupName, createGroup, joinGroup, leaveGroup, normalizeInviteCode } from "@/lib/groups/queries";
import { getViewer } from "@/lib/player";

/** Grupo exige conta: sem login, manda pro /entrar e volta pra `next`. */
async function requireAccountPlayer(next: string): Promise<string> {
  const viewer = await getViewer();
  if (!viewer.account || !viewer.playerId) redirect(`/entrar?next=${encodeURIComponent(next)}`);
  return viewer.playerId;
}

export async function createGroupAction(formData: FormData) {
  const playerId = await requireAccountPlayer("/grupos");
  const name = cleanGroupName(formData.get("name"));
  if (!name) redirect("/grupos?erro=nome");
  const group = await createGroup(appDb(), playerId, name);
  if (group === "too-many") redirect("/grupos?erro=limite");
  redirect(`/grupos/${group.id}?novo=1`);
}

export async function joinGroupAction(formData: FormData) {
  const raw = String(formData.get("code") ?? "");
  const code = normalizeInviteCode(raw);
  if (!code) redirect("/grupos?erro=codigo");
  const playerId = await requireAccountPlayer(`/convite/${code}`);
  const result = await joinGroup(appDb(), playerId, code);
  if (result === "not-found") redirect("/grupos?erro=codigo");
  if (result === "too-many") redirect("/grupos?erro=limite");
  redirect(`/grupos/${result.groupId}`);
}

/** Abre o convite digitado (a tela do convite mostra o nome do grupo antes de entrar). */
export async function openInviteAction(formData: FormData) {
  const code = normalizeInviteCode(String(formData.get("code") ?? ""));
  if (!code) redirect("/grupos?erro=codigo");
  redirect(`/convite/${code}`);
}

export async function leaveGroupAction(formData: FormData) {
  const groupId = String(formData.get("groupId") ?? "");
  const playerId = await requireAccountPlayer("/grupos");
  if (/^[0-9a-f-]{36}$/i.test(groupId)) await leaveGroup(appDb().exec, playerId, groupId);
  redirect("/grupos?saiu=1");
}
