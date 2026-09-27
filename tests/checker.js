// SewAndSo layout checker. Paste into DevTools, then run: sasCheck() or sasCheck({ touch: true }).
(function () {
  const MIN_FONT_PX = 17;
  const TOUCH_MIN = 44;
  const POINTER_MIN = 40;
  const TOLERANCE = 1;
  const CONTROL = 'button, a[href], input, select, textarea, [role=radio], [role=tab]';
  const OVERLAP_CONTROL = 'button, a, input, [role=radio], [role=tab]';
  const TARGET = 'button, a[href], input, select, [role=radio], [role=tab]';
  const BOX_ATOM = new Set(['IMG', 'INPUT', 'SELECT', 'TEXTAREA']);
  const SKIP_TEXT = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'TITLE', 'OPTION', 'SELECT', 'TEXTAREA']);

  function pathOf(el) {
    const parts = [];
    for (let e = el; e && e.nodeType === 1 && e !== document.documentElement; e = e.parentElement) {
      if (e.id) { parts.unshift(`${e.localName}#${e.id}`); break; }
      let part = e.localName;
      const cls = typeof e.className === 'string' ? e.className.trim().split(/\s+/).filter(Boolean).slice(0, 2) : [];
      if (cls.length) part += '.' + cls.join('.');
      const parent = e.parentElement;
      if (parent) {
        const same = [...parent.children].filter((c) => c.localName === e.localName);
        if (same.length > 1) part += `:nth-of-type(${same.indexOf(e) + 1})`;
      }
      parts.unshift(part);
    }
    return parts.join(' > ');
  }

  function snippet(s) {
    const t = (s || '').replace(/\s+/g, ' ').trim();
    return t.length > 60 ? t.slice(0, 57) + '...' : t;
  }

  function round(r) {
    return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.right - r.left), h: Math.round(r.bottom - r.top) };
  }

  function intersect(a, b) {
    return { left: Math.max(a.left, b.left), top: Math.max(a.top, b.top), right: Math.min(a.right, b.right), bottom: Math.min(a.bottom, b.bottom) };
  }

  function overlapAmount(a, b) {
    const i = intersect(a, b);
    return { w: i.right - i.left, h: i.bottom - i.top };
  }

  const colorCache = new Map();
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  // The canvas normalizes any CSS color syntax (rgb, color(), oklch, color-mix results) to sRGB bytes.
  function parseColor(str) {
    if (colorCache.has(str)) return colorCache.get(str);
    const m = str.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/);
    let c;
    if (m) {
      let a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
      c = { r: +m[1], g: +m[2], b: +m[3], a };
    } else {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.fillStyle = str;
      ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      c = { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
    }
    colorCache.set(str, c);
    return c;
  }

  function over(top, bottom) {
    const a = top.a + bottom.a * (1 - top.a);
    if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
    const mix = (k) => (top[k] * top.a + bottom[k] * bottom.a * (1 - top.a)) / a;
    return { r: mix('r'), g: mix('g'), b: mix('b'), a };
  }

  function luminance({ r, g, b }) {
    const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  }

  function contrast(a, b) {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  }

  function hex(c) {
    return '#' + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  }

  function effectiveOpacity(el) {
    let o = 1;
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity);
    return o;
  }

  const CLIPS = new Set(['hidden', 'clip', 'scroll', 'auto']);
  // Clip a rect by the ancestors that actually clip it: overflow only clips descendants whose containing
  // block chain passes through that ancestor, so fixed and absolute elements skip unpositioned ones.
  function clipRect(el, rect) {
    let r = { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
    let pos = getComputedStyle(el).position;
    for (let e = el.parentElement; e && e !== document.documentElement && e !== document.body; e = e.parentElement) {
      const cs = getComputedStyle(e);
      const establishes = cs.transform !== 'none' || cs.filter !== 'none' || /paint|layout|strict|content/.test(cs.contain);
      if (pos === 'fixed' && !establishes) continue;
      if (pos === 'absolute' && cs.position === 'static' && !establishes) continue;
      pos = cs.position;
      if (cs.clipPath && cs.clipPath.startsWith('inset(50%')) return null;
      if (cs.clip && /rect\(0(px)?,? 0(px)?/.test(cs.clip)) return null;
      const cx = CLIPS.has(cs.overflowX), cy = CLIPS.has(cs.overflowY);
      if (!cx && !cy) continue;
      const b = e.getBoundingClientRect();
      r = {
        left: cx ? Math.max(r.left, b.left) : r.left,
        right: cx ? Math.min(r.right, b.right) : r.right,
        top: cy ? Math.max(r.top, b.top) : r.top,
        bottom: cy ? Math.min(r.bottom, b.bottom) : r.bottom,
      };
      if (r.right - r.left <= TOLERANCE || r.bottom - r.top <= TOLERANCE) return null;
    }
    return r;
  }

  function isShown(el) {
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.visibility === 'collapse' || cs.display === 'none') return false;
    if (cs.clipPath && cs.clipPath.startsWith('inset(50%')) return false;
    if (cs.clip && /rect\(0(px)?,? 0(px)?/.test(cs.clip)) return false;
    return effectiveOpacity(el) > 0;
  }

  // Range rects cover the font's content area, which is taller than the line box when line-height < ~1.2.
  // Crop to the line box so stacked lines of tight headings do not read as colliding.
  function lineBox(rect, cs) {
    const lh = parseFloat(cs.lineHeight);
    const h = rect.bottom - rect.top;
    if (!Number.isFinite(lh) || lh >= h) return rect;
    const mid = (rect.top + rect.bottom) / 2;
    return { left: rect.left, right: rect.right, top: mid - lh / 2, bottom: mid + lh / 2 };
  }

  function ownText(el) {
    let s = '';
    for (const n of el.childNodes) if (n.nodeType === 3) s += n.data;
    return s.trim() ? s : '';
  }

  function textRects(el, cs) {
    const rects = [];
    for (const n of el.childNodes) {
      if (n.nodeType !== 3 || !n.data.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      for (const r of range.getClientRects()) {
        if (r.width < 0.5 || r.height < 0.5) continue;
        const clipped = clipRect(el, lineBox(r, cs));
        if (clipped) rects.push(clipped);
      }
    }
    return rects;
  }

  function collect() {
    const atoms = [];
    const texts = [];
    const all = document.body ? document.body.querySelectorAll('*') : [];
    for (const el of all) {
      if (el.closest('svg') && el.localName !== 'svg') continue;
      if (el.localName === 'svg' && el.parentElement && el.parentElement.closest('svg')) continue;
      const isBox = BOX_ATOM.has(el.tagName) || el.localName === 'svg';
      const text = !isBox && !SKIP_TEXT.has(el.tagName) ? ownText(el) : '';
      if (!isBox && !text) continue;
      if (!isShown(el)) continue;
      const cs = getComputedStyle(el);
      const optOut = !!el.closest('[data-layer="back"], [data-overlap-ok]');
      if (isBox) {
        if (el.type === 'hidden') continue;
        const r = el.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) continue;
        const clipped = clipRect(el, r);
        if (!clipped) continue;
        atoms.push({ el, type: el.localName, rects: [clipped], optOut, text: el.getAttribute('aria-label') || el.getAttribute('alt') || el.value || '' });
      } else {
        const rects = textRects(el, cs);
        if (!rects.length) continue;
        const atom = { el, type: 'text', rects, optOut, text, cs };
        atoms.push(atom);
        texts.push(atom);
      }
    }
    return { atoms, texts };
  }

  function checkOverlap(atoms, out) {
    const live = atoms.filter((a) => !a.optOut);
    for (let i = 0; i < live.length; i++) {
      for (let j = i + 1; j < live.length; j++) {
        const a = live[i], b = live[j];
        if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
        let hit = null;
        for (const ra of a.rects) {
          for (const rb of b.rects) {
            const o = overlapAmount(ra, rb);
            if (o.w > TOLERANCE && o.h > TOLERANCE) { hit = { ra, rb, o }; break; }
          }
          if (hit) break;
        }
        if (hit) {
          out.push({
            kind: 'OVERLAP',
            path: pathOf(a.el),
            text: snippet(a.text),
            detail: {
              a: { type: a.type, rect: round(hit.ra) },
              b: { type: b.type, path: pathOf(b.el), text: snippet(b.text), rect: round(hit.rb) },
              overlapPx: { w: Math.round(hit.o.w * 10) / 10, h: Math.round(hit.o.h * 10) / 10 },
            },
          });
        }
      }
    }
    const controls = [...document.querySelectorAll(OVERLAP_CONTROL)]
      .filter((el) => isShown(el) && !el.closest('[data-layer="back"], [data-overlap-ok]'))
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter((c) => c.r.width >= 1 && c.r.height >= 1);
    for (let i = 0; i < controls.length; i++) {
      for (let j = i + 1; j < controls.length; j++) {
        const a = controls[i], b = controls[j];
        if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
        const o = overlapAmount(a.r, b.r);
        if (o.w > TOLERANCE && o.h > TOLERANCE) {
          out.push({
            kind: 'OVERLAP',
            path: pathOf(a.el),
            text: snippet(a.el.textContent || a.el.getAttribute('aria-label')),
            detail: {
              controls: true,
              a: { type: a.el.localName, rect: round(a.r) },
              b: { type: b.el.localName, path: pathOf(b.el), text: snippet(b.el.textContent || b.el.getAttribute('aria-label')), rect: round(b.r) },
              overlapPx: { w: Math.round(o.w * 10) / 10, h: Math.round(o.h * 10) / 10 },
            },
          });
        }
      }
    }
  }

  function checkOverflow(texts, out) {
    const se = document.scrollingElement || document.documentElement;
    // Mobile browsers zoom out to fit wide content, which inflates innerWidth; the layout width stays put.
    const vw = Math.min(innerWidth, document.documentElement.clientWidth || innerWidth);
    if (se.scrollWidth > vw + TOLERANCE) {
      const culprits = [...document.body.querySelectorAll('*')]
        .filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.right > vw + TOLERANCE && isShown(el); })
        .filter((el, _, arr) => !arr.some((o) => o !== el && el.contains(o)))
        .slice(0, 5)
        .map((el) => ({ path: pathOf(el), right: Math.round(el.getBoundingClientRect().right) }));
      out.push({ kind: 'OVERFLOW', path: 'html', text: '', detail: { page: true, scrollWidth: se.scrollWidth, layoutWidth: vw, innerWidth, culprits } });
    }
    for (const t of texts) {
      const cs = t.cs;
      if (cs.display === 'inline' || cs.display === 'contents') continue;
      const clipsX = CLIPS.has(cs.overflowX) && t.el.scrollWidth > t.el.clientWidth + TOLERANCE;
      const clipsY = CLIPS.has(cs.overflowY) && t.el.scrollHeight > t.el.clientHeight + TOLERANCE;
      if (clipsX || clipsY) {
        out.push({
          kind: 'OVERFLOW',
          path: pathOf(t.el),
          text: snippet(t.text),
          detail: { scrollWidth: t.el.scrollWidth, clientWidth: t.el.clientWidth, scrollHeight: t.el.scrollHeight, clientHeight: t.el.clientHeight, overflow: `${cs.overflowX} ${cs.overflowY}` },
        });
      }
    }
  }

  function checkText(texts, out) {
    for (const t of texts) {
      const size = parseFloat(t.cs.fontSize);
      if (size < MIN_FONT_PX) out.push({ kind: 'SMALL-TEXT', path: pathOf(t.el), text: snippet(t.text), detail: { fontSize: size, min: MIN_FONT_PX } });
      for (let e = t.el; e && e.nodeType === 1; e = e.parentElement) {
        if (getComputedStyle(e).textDecorationLine.includes('underline')) {
          out.push({ kind: 'UNDERLINE', path: pathOf(t.el), text: snippet(t.text), detail: { decoratedBy: pathOf(e) } });
          break;
        }
      }
    }
    for (const el of document.querySelectorAll('input:not([type=hidden]), select, textarea')) {
      if (!isShown(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      if (['checkbox', 'radio', 'range', 'color', 'image'].includes(el.type)) continue;
      const size = parseFloat(getComputedStyle(el).fontSize);
      if (size < MIN_FONT_PX) out.push({ kind: 'SMALL-TEXT', path: pathOf(el), text: snippet(el.value || el.placeholder), detail: { fontSize: size, min: MIN_FONT_PX, control: true } });
    }
  }

  function checkTargets(touch, out) {
    const min = touch ? TOUCH_MIN : POINTER_MIN;
    for (const el of document.querySelectorAll(TARGET)) {
      if (!isShown(el) || el.type === 'hidden') continue;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      if (r.width + 0.01 < min || r.height + 0.01 < min) {
        out.push({ kind: 'TOUCH-TARGET', path: pathOf(el), text: snippet(el.textContent || el.getAttribute('aria-label')), detail: { w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10, min } });
      }
    }
  }

  function isImageGround(el) {
    if (el.closest('[data-layer="back"]')) return 'data-layer="back"';
    const bi = getComputedStyle(el).backgroundImage;
    return bi && bi !== 'none' ? 'background-image' : null;
  }

  // The root background, or body's when the root has none, paints the canvas beneath every layer,
  // including negative z-index backdrops, even though elementsFromPoint lists body above them.
  function canvasElement() {
    const html = document.documentElement;
    const hs = getComputedStyle(html);
    const rootEmpty = parseColor(hs.backgroundColor).a === 0 && hs.backgroundImage === 'none';
    return rootEmpty && document.body ? document.body : html;
  }

  // Walk the painted stack under the text's first line (elementsFromPoint), compositing backgrounds
  // from the text element downward until an opaque layer. Pointer-events are forced on so decorative
  // layers with pointer-events:none still appear in the stack.
  function groundOf(t) {
    const r = t.rects[0];
    const x = (r.left + r.right) / 2, y = (r.top + r.bottom) / 2;
    const canvas = canvasElement();
    const stack = document.elementsFromPoint(x, y);
    let start = stack.indexOf(t.el);
    if (start < 0) start = stack.findIndex((e) => e.contains(t.el));
    let layers = start >= 0 ? stack.slice(start) : [];
    if (!layers.length) for (let e = t.el; e; e = e.parentElement) layers.push(e);
    layers = layers.filter((e) => e !== canvas && e !== document.documentElement);
    layers.push(canvas);
    let bg = { r: 0, g: 0, b: 0, a: 0 };
    for (const el of layers) {
      const image = isImageGround(el);
      if (image) return { image, el };
      const c = parseColor(getComputedStyle(el).backgroundColor);
      if (c.a > 0) bg = over(bg, { ...c, a: c.a * (el === canvas ? 1 : effectiveOpacity(el)) });
      if (bg.a >= 0.999) return { color: bg, el };
    }
    return { color: over(bg, { r: 255, g: 255, b: 255, a: 1 }), el: canvas };
  }

  function checkContrast(texts, out) {
    const force = document.createElement('style');
    force.textContent = '* { pointer-events: auto !important; }';
    document.head.appendChild(force);
    const se = document.scrollingElement || document.documentElement;
    const saved = { x: se.scrollLeft, y: se.scrollTop };
    try {
      for (const t of texts) {
        const first = t.rects[0];
        if (first.top < 0 || first.bottom > innerHeight || first.left < 0 || first.right > innerWidth) {
          window.scrollBy(first.left + (first.right - first.left) / 2 - innerWidth / 2, first.top - innerHeight / 2);
          t.rects = textRects(t.el, t.cs);
          if (!t.rects.length) continue;
        }
        const g = groundOf(t);
        if (g.image) {
          out.push({ kind: 'TEXT-ON-IMAGE', path: pathOf(t.el), text: snippet(t.text), detail: { ground: pathOf(g.el), via: g.image } });
          continue;
        }
        const fg = parseColor(t.cs.color);
        const ink = over({ ...fg, a: fg.a * effectiveOpacity(t.el) }, g.color);
        const ratio = contrast(ink, g.color);
        const size = parseFloat(t.cs.fontSize);
        const weight = parseInt(t.cs.fontWeight, 10) || 400;
        const large = size >= 24 || (size >= 18.66 && weight >= 700);
        const need = large ? 3 : 4.5;
        if (ratio + 0.005 < need) {
          out.push({ kind: 'CONTRAST', path: pathOf(t.el), text: snippet(t.text), detail: { ratio: Math.round(ratio * 100) / 100, need, fg: hex(ink), bg: hex(g.color), ground: pathOf(g.el), fontSize: size, fontWeight: weight } });
        }
      }
    } finally {
      force.remove();
      se.scrollLeft = saved.x;
      se.scrollTop = saved.y;
    }
  }

  function sasCheck(opts = {}) {
    const touch = opts.touch ?? matchMedia('(pointer: coarse)').matches;
    const violations = [];
    const { atoms, texts } = collect();
    checkOverlap(atoms, violations);
    checkOverflow(texts, violations);
    checkText(texts, violations);
    checkTargets(touch, violations);
    checkContrast(texts, violations);
    const optOuts = {
      layerBack: document.querySelectorAll('[data-layer="back"]').length,
      overlapOk: document.querySelectorAll('[data-overlap-ok]').length,
      atomsExcluded: atoms.filter((a) => a.optOut).length,
    };
    const result = { violations, optOuts, atoms: atoms.length, textAtoms: texts.length, touch, viewport: { w: innerWidth, h: innerHeight } };
    if (opts.log) console.table(violations.map((v) => ({ kind: v.kind, path: v.path, text: v.text, detail: JSON.stringify(v.detail) })));
    return result;
  }

  window.sasCheck = sasCheck;
})();
