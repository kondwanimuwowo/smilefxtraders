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
    <div
      className="rounded-2xl p-5 mb-6 flex items-center gap-3"
      style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
    >
      <Icon name="person_add" size={18} style={{ color: "var(--gold)" }} />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleInvite()}
        placeholder="Invite a trader by email…"
        className="flex-1 rounded-[9px] border px-3 py-2.5 text-[13.5px] outline-none focus:ring-2 focus:ring-[rgba(8,174,170,0.25)] focus:border-[var(--teal)]"
        style={{ background: "var(--panel-2)", borderColor: "var(--line)", color: "var(--ink-strong)" }}
      />
      <Button type="button" variant="primary" icon="send" loading={sending} onClick={handleInvite}>
        Send invite
      </Button>
    </div>
  );
}
