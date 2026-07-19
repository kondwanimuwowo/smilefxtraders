"use client";

import { useParams, useRouter } from "next/navigation";
import { useTrades } from "@/lib/hooks/useTrades";
import { Button, Icon } from "@/components/ui";
import { TradeForm } from "../../TradeForm";

export default function EditTradePage() {
  const { id }     = useParams<{ id: string }>();
  const router     = useRouter();
  const { trades } = useTrades();
  const trade = trades.find((t) => t.id === id) ?? null;

  if (!trade) {
    return (
      <div className="view flex flex-col items-center justify-center gap-4 py-24">
        <Icon name="search_off" size={48} className="text-ink-dim" />
        <p className="text-[14px] text-ink-dim">Trade not found.</p>
        <Button type="button" variant="ghost" icon="arrow_back" onClick={() => router.push("/journal")}>
          Back to journal
        </Button>
      </div>
    );
  }

  return (
    <div className="view">
      <TradeForm
        edit={trade}
        onSaved={() => router.push(`/journal/${id}`)}
        onCancel={() => router.back()}
      />
    </div>
  );
}
