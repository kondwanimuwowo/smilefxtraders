"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button, Icon } from "@/components/ui";

export function InviteUserForm() {
  const { toast } = useStore();
  const [email, setEmail]     = useState("");
  const [sending, setSending] = useState(false);

  async function handleInvite() {
    const trimmed = email.trim();
    if (!trimmed) return;

    setSending(true);
    try {
      const res = await fetch("/api/admin/invite", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Invite failed", "coral", "error");
      } else {
        toast(`Invite sent to ${trimmed}`, "teal", "check_circle");
        setEmail("");
      }
    } catch {
      toast("Could not reach the server", "coral", "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-2xl p-5 mb-6 flex items-center gap-3 bg-panel shadow-md">
      <Icon name="person_add" size={18} className="text-gold" />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleInvite()}
        placeholder="Invite a trader by email…"
        className="flex-1 rounded-[9px] px-3 py-2.5 text-[13.5px] outline-none transition-shadow shadow-[inset_0_1px_3px_rgba(0,0,0,0.12)] focus:shadow-[inset_0_1px_3px_rgba(0,0,0,0.12),0_0_0_2px_var(--teal)] bg-panel-2 text-ink-strong"
      />
      <Button type="button" variant="primary" icon="send" loading={sending} onClick={handleInvite}>
        Send invite
      </Button>
    </div>
  );
}
