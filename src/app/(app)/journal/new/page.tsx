"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Trade } from "@/lib/store";
import { TradeForm } from "../TradeForm";

const PRESET_KEY = "journal:preset";

export default function NewTradePage() {
  const router = useRouter();
  const [preset, setPreset] = useState<Partial<Trade> | null | undefined>(undefined);

  // A preset (from the Validator's "log this setup" action) is handed off via
  // sessionStorage rather than a URL — it carries too many typed/optional
  // fields to serialize cleanly as query params.
  useEffect(() => {
    const raw = sessionStorage.getItem(PRESET_KEY);
    if (raw) {
      sessionStorage.removeItem(PRESET_KEY);
      try {
        setPreset(JSON.parse(raw) as Partial<Trade>);
      } catch {
        setPreset(null);
      }
    } else {
      setPreset(null);
    }
  }, []);

  // Wait for the sessionStorage check before rendering so a preset isn't
  // momentarily rendered as a blank form and then repopulated.
  if (preset === undefined) return null;

  return (
    <div className="view">
      <TradeForm
        preset={preset}
        onSaved={() => router.push("/journal")}
        onCancel={() => router.back()}
      />
    </div>
  );
}
