import { Icon } from "@/components/ui";

/** Upgrade prompt shown when a FREE-plan user opens a COT page (API returned 403). */
export function CotLockScreen() {
  return (
    <div className="view flex flex-col items-center justify-center min-h-[60vh]">
      <div className="rounded-3xl px-10 py-12 text-center max-w-md bg-panel border border-line">
        <Icon name="lock" size={36} fill className="text-gold mb-4" />
        <h2 className="font-display font-bold text-[22px] mb-2 tracking-[-0.02em] text-ink-strong">COT Reports</h2>
        <p className="text-[13.5px] leading-relaxed mb-6 text-ink-dim">
          CFTC Commitments of Traders data is available on the <strong className="text-ink-strong">Pro Trader</strong> and <strong className="text-ink-strong">Funded Track</strong> plans. Understand institutional positioning to align your bias with smart money.
        </p>
        <a
          href="/membership"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-[13.5px] bg-gold text-navy-deep"
        >
          <Icon name="workspace_premium" size={16} fill />
          Upgrade to Pro
        </a>
      </div>
    </div>
  );
}
