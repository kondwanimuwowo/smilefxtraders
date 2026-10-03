"use client";

import { Button } from "@/components/ui";

interface LeadRow {
  id: string;
  email: string;
  source: string;
  createdAt: string;
}

export function LeadsExport({ rows }: { rows: LeadRow[] }) {
  function download() {
    const header = "email,source,signed_up_utc";
    const body = rows.map((r) => `${r.email},${r.source},${r.createdAt}`);
    const blob = new Blob([[header, ...body].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" size="md" icon="download" onClick={download} disabled={rows.length === 0}>
      Export CSV
    </Button>
  );
}
