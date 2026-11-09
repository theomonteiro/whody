"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

/** Link do convite com botão de compartilhar (ou copiar, quando o aparelho não tem compartilhar). */
export function InviteLink({ url, groupName }: { url: string; groupName: string }) {
  const t = useTranslations("group");
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function share() {
    const text = t("inviteText", { name: groupName });
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: groupName, text, url });
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  }

  return (
    <div>
      <p className="truncate rounded-xl border border-dashed border-[#c9b99c] bg-paper px-3 py-2.5 font-mono text-[15px] text-ink">
        {url}
      </p>
      <button
        type="button"
        onClick={share}
        className="mt-3 flex h-12 w-full items-center justify-center rounded-2xl border-[1.5px] border-ink bg-card font-display text-lg text-ink transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stamp"
      >
        {t("inviteButton")}
      </button>
      <p role="status" className="mt-1.5 min-h-5 text-center text-sm text-ink-soft">
        {status === "copied" ? t("inviteCopied") : status === "failed" ? t("inviteCopyFailed") : ""}
      </p>
    </div>
  );
}
