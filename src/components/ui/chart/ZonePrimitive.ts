// Draws SMC zones (FVG / order block) as bounded translucent rectangles.
//
// The old CandleChart faked a zone with two createPriceLine calls — which run
// the full width of the chart, in both directions, forever. One FVG therefore
// drew four horizontal lines plus two axis labels, and said nothing true about
// *when* the zone applied. That was most of the visual noise.
//
// A series primitive can paint an actual box bounded in both time and price,
// which is what the reference designs show and what the concept means.

import type {
  ISeriesPrimitive, IPrimitivePaneView, IPrimitivePaneRenderer,
  SeriesAttachedParameter, PrimitivePaneViewZOrder, Time, IChartApi, ISeriesApi,
} from "lightweight-charts";
import type { CanvasRenderingTarget2D } from "fancy-canvas";

export interface ChartZone {
  /** Bar time (epoch seconds) the zone starts at. */
  from:  Time;
  /** Bar time it stops at. */
  to:    Time;
  price1: number;
  price2: number;
  /** Any CSS colour; drawn at low opacity with a slightly stronger edge. */
  color: string;
  label?: string;
}

const FILL_ALPHA = 0.10;
const EDGE_ALPHA = 0.45;

function withAlpha(color: string, alpha: number): string {
  // Tokens resolve to hex (#08AEAA) via getComputedStyle before reaching here.
  if (color.startsWith("#") && (color.length === 7 || color.length === 4)) {
    const hex = color.length === 4
      ? color.slice(1).split("").map((c) => c + c).join("")
      : color.slice(1);
    const n = parseInt(hex, 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
  }
  return color;
}

class ZoneRenderer implements IPrimitivePaneRenderer {
  constructor(
    private readonly zones: ChartZone[],
    private readonly chart: IChartApi,
    private readonly series: ISeriesApi<"Candlestick">,
  ) {}

  draw(target: CanvasRenderingTarget2D): void {
    target.useBitmapCoordinateSpace((scope) => {
      const { context: ctx, horizontalPixelRatio: hr, verticalPixelRatio: vr } = scope;
      const timeScale = this.chart.timeScale();

      for (const zone of this.zones) {
        const x1 = timeScale.timeToCoordinate(zone.from);
        const x2 = timeScale.timeToCoordinate(zone.to);
        const y1 = this.series.priceToCoordinate(zone.price1);
        const y2 = this.series.priceToCoordinate(zone.price2);
        // Any coordinate is null once its bar scrolls out of view; skipping is
        // correct, since a half-placed rectangle would be worse than none.
        if (x1 == null || x2 == null || y1 == null || y2 == null) continue;

        const left = Math.min(x1, x2) * hr;
        const right = Math.max(x1, x2) * hr;
        const top = Math.min(y1, y2) * vr;
        const bottom = Math.max(y1, y2) * vr;

        ctx.fillStyle = withAlpha(zone.color, FILL_ALPHA);
        ctx.fillRect(left, top, right - left, bottom - top);

        // Edges only on the price boundaries: those are the levels that matter.
        // Boxing all four sides reads as a UI element rather than a price zone.
        ctx.fillStyle = withAlpha(zone.color, EDGE_ALPHA);
        ctx.fillRect(left, top, right - left, Math.max(1, hr));
        ctx.fillRect(left, bottom - Math.max(1, vr), right - left, Math.max(1, vr));
      }
    });
  }
}

class ZonePaneView implements IPrimitivePaneView {
  constructor(private readonly renderer_: ZoneRenderer) {}
  // Behind the candles — a zone is context, and must never obscure the price
  // action a trader is reading.
  zOrder(): PrimitivePaneViewZOrder { return "bottom"; }
  renderer(): IPrimitivePaneRenderer { return this.renderer_; }
}

export class ZonePrimitive implements ISeriesPrimitive<Time> {
  private views: ZonePaneView[] = [];
  private requestUpdate?: () => void;

  constructor(private zones: ChartZone[]) {}

  attached(param: SeriesAttachedParameter<Time>): void {
    this.requestUpdate = param.requestUpdate;
    this.views = [
      new ZonePaneView(
        new ZoneRenderer(this.zones, param.chart as IChartApi, param.series as ISeriesApi<"Candlestick">),
      ),
    ];
  }

  detached(): void {
    this.views = [];
    this.requestUpdate = undefined;
  }

  paneViews(): readonly IPrimitivePaneView[] {
    return this.views;
  }

  setZones(zones: ChartZone[]): void {
    this.zones.length = 0;
    this.zones.push(...zones);
    this.requestUpdate?.();
  }
}
