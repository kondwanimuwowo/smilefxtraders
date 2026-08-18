// Paste into the devtools console on any page to audit text contrast.
//
// Why this and not the devtools "Contrast" readout: that one checks a single
// selected element, and this codebase's failures came in families (one token
// used in 200 places). This walks every element that owns a text node and
// reports the whole page at once.
//
// What it does that a naive check does not:
//   - composites translucent backgrounds down the ancestor chain to the first
//     opaque surface, so a -tint pill on --panel-2 is measured as painted
//   - composites the text color's own alpha (and inherited opacity) too
//   - applies the WCAG large-text exemption (>=24px, or >=18.66px at 700+)
//   - SKIPS rather than guesses where it cannot know the real backdrop:
//     gradient-backed elements, and fixed/sticky bars floating over content
//     whose visual backdrop is not their DOM ancestor
//
// The skip counts matter — a page reporting 0 failures but 30 skips has not
// been cleared. Check those by eye.

(function () {
  const px = (c) => {
    const m = c.match(/[\d.]+/g);
    return m ? [+m[0], +m[1], +m[2], m[3] === undefined ? 1 : +m[3]] : null;
  };
  const over = (f, b) => [0, 1, 2].map((i) => f[3] * f[i] + (1 - f[3]) * b[i]).concat(1);
  const lum = (c) => {
    const f = c.slice(0, 3).map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2];
  };
  const cr = (a, b) => {
    const x = lum(a), y = lum(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };

  const fails = [], skip = { gradient: 0, overlay: 0 };
  let checked = 0;

  document.querySelectorAll("body *").forEach((el) => {
    const own = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (!own.length) return;

    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") return;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const op = parseFloat(cs.opacity);
    if (op < 0.15) return;

    const stack = [];
    let e = el, floated = false, bad = null;
    while (e) {
      const s = getComputedStyle(e), c = px(s.backgroundColor);
      if (/gradient|url\(/.test(s.backgroundImage)) { bad = "gradient"; break; }
      if (/fixed|sticky/.test(s.position) && !(c && c[3] === 1)) floated = true;
      if (c && c[3] > 0) stack.push(c);
      if (c && c[3] === 1) break;
      e = e.parentElement;
    }
    if (bad) { skip[bad]++; return; }
    if (floated) { skip.overlay++; return; }

    let base = [255, 255, 255, 1];
    for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base);

    let fg = px(cs.color);
    if (!fg) return;
    fg = [fg[0], fg[1], fg[2], fg[3] * op];

    const ratio = cr(over(fg, base), base);
    const size = parseFloat(cs.fontSize), w = parseInt(cs.fontWeight) || 400;
    const need = size >= 24 || (size >= 18.66 && w >= 700) ? 3 : 4.5;
    checked++;
    if (ratio < need) {
      fails.push({
        text: own.map((n) => n.textContent.trim()).join(" ").slice(0, 44),
        ratio: +ratio.toFixed(2), need, size,
        color: cs.color,
        bg: "rgb(" + base.slice(0, 3).map(Math.round).join(",") + ")",
        el,
      });
    }
  });

  fails.sort((a, b) => a.ratio - b.ratio);
  console.log(`checked ${checked} · ${fails.length} below AA · skipped`, skip);
  if (fails.length) console.table(fails.map(({ el, ...r }) => r));
  return fails;
})();
