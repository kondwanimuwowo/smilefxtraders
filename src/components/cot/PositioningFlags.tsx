import { Icon } from "@/components/ui";
import type { CotPositioning } from "@/lib/cot/positioning";

interface Flag {
  title: string;
  body:  string;
}

function buildFlags(pair: string, p: CotPositioning): Flag[] {
  const flags: Flag[] = [];
  if (p.crowding) {
    const side = p.crowding.side === "long" ? `long ${pair}` : `short ${pair}`;
    flags.push({
      title: "Crowded positioning",
      body: p.crowding.reason === "share_of_oi" && p.crowding.pctOfOi != null
        ? `Large specs are ${side} with ${Math.round(Math.abs(p.crowding.pctOfOi) * 100)}% of open interest. A side this crowded can unwind fast, so late entries in its direction carry squeeze risk.`
        : `Large specs are ${side} at an extreme of their 3-year range. There are few traders left to join them, and an unwind can be sharp.`,
    });
  }
  if (p.vsPrice) {
    const added = p.vsPrice.specChange13w > 0 ? "added longs" : "added shorts";
    const move = `${p.vsPrice.priceChangePct > 0 ? "rose" : "fell"} ${Math.abs(p.vsPrice.priceChangePct).toFixed(1)}%`;
    flags.push({
      title: "Specs are fighting price",
      body: `Over 13 weeks large specs ${added} while ${pair} ${move}. They are likely underwater. The signal still shows their direction, but it is a weak timing tool until price turns their way.`,
    });
  }
  return flags;
}

export function PositioningFlags({ pair, positioning }: { pair: string; positioning?: CotPositioning }) {
  if (!positioning) return null;
  const flags = buildFlags(pair, positioning);
  if (!flags.length) return null;
  return (
    <div className="mb-6 flex flex-col gap-2">
      {flags.map((f) => (
        <div key={f.title} className="rounded-2xl px-5 py-3.5 flex items-start gap-3 bg-gold-tint-soft shadow-ring-gold">
          <Icon name="warning" size={17} className="text-gold-deep shrink-0 mt-px" />
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-ink-strong">{f.title}</div>
            <p className="text-[12.5px] leading-relaxed text-ink-mid mt-0.5">{f.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
