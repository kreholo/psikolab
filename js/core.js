/* PsikoLab çekirdeği: sekmeler, ayarlar, sahne API'si, sonuç/doğrulama, otomatik self-test */
(function () {
'use strict';

class Aborted extends Error { constructor() { super('aborted'); this.name = 'Aborted'; } }

const Lab = window.Lab = {
  experiments: [], byId: {}, run: null, test: false, botMode: 'smart', errors: [], overrides: null, Aborted
};

/* ================= yardımcılar ================= */
const U = Lab.u = {};
const PALETTE = ['#4f46e5', '#0ea5e9', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#ec4899'];
U.PALETTE = PALETTE;

U.el = function (tag, attrs) {
  const e = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    const v = attrs[k]; if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if (k === 'html') e.innerHTML = v;
    else if (k.slice(0, 2) === 'on' && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (let i = 2; i < arguments.length; i++) {
    const kids = [].concat(arguments[i]);
    for (const c of kids) { if (c == null || c === false) continue; e.append(c.nodeType ? c : document.createTextNode(String(c))); }
  }
  return e;
};
U.esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
U.rand = (a, b) => a + Math.random() * (b - a);
U.int = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
U.pick = a => a[Math.floor(Math.random() * a.length)];
U.shuffle = (a, rnd) => { const r = a.slice(); const f = rnd || Math.random; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(f() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
U.rng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
U.clamp = (x, a, b) => Math.max(a, Math.min(b, x));
U.range = n => Array.from({ length: n }, (_, i) => i);
const num = a => a.filter(x => typeof x === 'number' && isFinite(x));
U.sum = a => num(a).reduce((s, x) => s + x, 0);
U.mean = a => { a = num(a); return a.length ? U.sum(a) / a.length : NaN; };
U.sd = a => { a = num(a); if (a.length < 2) return NaN; const m = U.mean(a); return Math.sqrt(U.sum(a.map(x => (x - m) * (x - m))) / (a.length - 1)); };
U.median = a => { a = num(a).sort((x, y) => x - y); if (!a.length) return NaN; const m = a.length >> 1; return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; };
U.sem = a => { a = num(a); return a.length > 1 ? U.sd(a) / Math.sqrt(a.length) : 0; };
U.fmt = (n, d = 0) => (n == null || typeof n !== 'number' || !isFinite(n)) ? '–' : n.toFixed(d).replace('.', ',');
U.pct = (x, d = 0) => (x == null || !isFinite(x)) ? '–' : U.fmt(x * 100, d) + '%';
U.ms = n => (n == null || !isFinite(n)) ? '–' : Math.round(n) + ' ms';
U.linreg = (xs, ys) => {
  const n = xs.length; if (n < 2) return { slope: NaN, intercept: NaN, r: NaN };
  const mx = U.mean(xs), my = U.mean(ys); let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; syy += (ys[i] - my) ** 2; }
  const slope = sxx ? sxy / sxx : NaN; return { slope, intercept: my - slope * mx, r: (sxx && syy) ? sxy / Math.sqrt(sxx * syy) : NaN };
};
// işaret saptama kuramı d' (log-doğrusal düzeltmeli)
U.dprime = (h, nS, fa, nN) => {
  const z = p => { // ters normal (Acklam yaklaşımı)
    const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
    const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
    const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
    const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
    const pl = 0.02425; let q, r;
    if (p < pl) { q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    if (p > 1 - pl) { q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    q = p - 0.5; r = q * q; return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  };
  return z((h + 0.5) / (nS + 1)) - z((fa + 0.5) / (nN + 1));
};
U.download = (name, text, mime) => {
  const blob = new Blob(['\ufeff' + text], { type: (mime || 'text/csv') + ';charset=utf-8' });
  const a = U.el('a', { href: URL.createObjectURL(blob), download: name });
  document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
};
U.toCSV = rows => {
  if (!rows || !rows.length) return '';
  const cols = []; rows.forEach(r => Object.keys(r).forEach(k => { if (!cols.includes(k)) cols.push(k); }));
  const q = v => { if (v == null) return ''; if (typeof v === 'number') return String(v).replace('.', ','); v = String(v); return /[;"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  return [cols.join(';')].concat(rows.map(r => cols.map(c => q(r[c])).join(';'))).join('\n');
};
const store = Lab.store = {
  get(k, d) { try { const v = localStorage.getItem('psl.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('psl.' + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem('psl.' + k); } catch (e) { /* yoksay */ } }
};

/* ================= SVG grafikler ================= */
U.svgBars = function (o) {
  const W = 520, H = o.height || 250, m = { l: 46, r: 10, t: o.title ? 22 : 14, b: 54 };
  const vals = o.values.map(v => (typeof v === 'number' && isFinite(v)) ? v : 0);
  const errs = o.errors || [];
  const max = o.max != null ? o.max : Math.max(1e-9, ...vals.map((v, i) => v + (errs[i] || 0))) * 1.12;
  const iw = W - m.l - m.r, ih = H - m.t - m.b, bw = iw / vals.length, dec = o.dec != null ? o.dec : (max < 10 ? 1 : 0);
  let s = `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="${U.esc(o.title || 'grafik')}">`;
  for (let i = 0; i <= 4; i++) { const y = m.t + ih - ih * i / 4; s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y}" y2="${y}" class="grid"/><text x="${m.l - 6}" y="${y + 4}" class="ax" text-anchor="end">${U.fmt(max * i / 4, dec)}</text>`; }
  if (o.unit) s += `<text x="${m.l}" y="11" class="ax">${U.esc(o.unit)}</text>`;
  vals.forEach((v, i) => {
    const h = ih * U.clamp(v / max, 0, 1), w = bw * 0.68, x = m.l + i * bw + (bw - w) / 2, y = m.t + ih - h;
    const col = (o.colors && o.colors[i]) || PALETTE[i % PALETTE.length];
    s += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${Math.max(h, 0.5).toFixed(1)}" rx="4" fill="${col}"/>`;
    if (errs[i]) { const e = ih * errs[i] / max, cx = x + w / 2; s += `<line x1="${cx}" x2="${cx}" y1="${y - e}" y2="${y + e}" stroke="#333" stroke-width="1.5"/><line x1="${cx - 4}" x2="${cx + 4}" y1="${y - e}" y2="${y - e}" stroke="#333"/>`; }
    const raw = o.values[i]; s += `<text x="${x + w / 2}" y="${y - 4 - (errs[i] ? ih * errs[i] / max : 0)}" text-anchor="middle" class="val">${(typeof raw === 'number' && isFinite(raw)) ? U.fmt(v, dec) : '–'}</text>`;
    const lab = String(o.labels[i]).split(/\n| (?=[^ ]+$)/).slice(0, 3);
    lab.forEach((t, k) => { s += `<text x="${x + w / 2}" y="${H - m.b + 15 + k * 13}" text-anchor="middle">${U.esc(t)}</text>`; });
  });
  return s + '</svg>';
};
U.svgLine = function (o) {
  const W = 520, H = o.height || 270, m = { l: 48, r: 14, t: 28, b: 42 };
  const all = [].concat(...o.series.map(s => s.pts)).filter(p => isFinite(p[0]) && isFinite(p[1]));
  if (!all.length) return '<p class="empty">Veri yok</p>';
  const xmin = o.xmin != null ? o.xmin : Math.min(...all.map(p => p[0])), xmax0 = o.xmax != null ? o.xmax : Math.max(...all.map(p => p[0]));
  const xmax = xmax0 === xmin ? xmin + 1 : xmax0;
  const ymin = o.ymin != null ? o.ymin : Math.min(0, ...all.map(p => p[1]));
  let ymax = o.ymax != null ? o.ymax : Math.max(...all.map(p => p[1])) * 1.1; if (ymax <= ymin) ymax = ymin + 1;
  const iw = W - m.l - m.r, ih = H - m.t - m.b, X = x => m.l + iw * (x - xmin) / (xmax - xmin), Y = y => m.t + ih - ih * (y - ymin) / (ymax - ymin);
  let s = `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="${U.esc(o.title || 'çizgi grafik')}">`;
  for (let i = 0; i <= 4; i++) { const v = ymin + (ymax - ymin) * i / 4, y = Y(v); s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y}" y2="${y}" class="grid"/><text x="${m.l - 6}" y="${y + 4}" class="ax" text-anchor="end">${U.fmt(v, (ymax - ymin) < 8 ? 1 : 0)}</text>`; }
  const xt = o.xticks || U.range(5).map(i => xmin + (xmax - xmin) * i / 4);
  xt.forEach(v => { s += `<text x="${X(v)}" y="${H - m.b + 15}" class="ax" text-anchor="middle">${U.fmt(v, (xmax - xmin) < 8 ? 1 : 0)}</text>`; });
  if (o.xlabel) s += `<text x="${m.l + iw / 2}" y="${H - 6}" text-anchor="middle" class="ax">${U.esc(o.xlabel)}</text>`;
  if (o.ylabel) s += `<text x="${m.l}" y="12" class="ax">${U.esc(o.ylabel)}</text>`;
  let lx = m.l + 60;
  o.series.forEach((se, i) => {
    const col = se.color || PALETTE[i % PALETTE.length], pts = se.pts.filter(p => isFinite(p[0]) && isFinite(p[1]));
    if (!pts.length) return;
    if (!se.noLine) s += `<polyline fill="none" stroke="${col}" stroke-width="2.2" ${se.dash ? 'stroke-dasharray="5 4"' : ''} points="${pts.map(p => X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1)).join(' ')}"/>`;
    if (se.dots !== false && pts.length <= 80) pts.forEach(p => { s += `<circle cx="${X(p[0]).toFixed(1)}" cy="${Y(p[1]).toFixed(1)}" r="${se.r || 3.2}" fill="${se.ptColor ? se.ptColor(p) : col}"/>`; });
    if (se.name) { s += `<rect x="${lx}" y="3" width="10" height="10" rx="2" fill="${col}"/><text x="${lx + 14}" y="12" class="leg">${U.esc(se.name)}</text>`; lx += 24 + se.name.length * 6; }
  });
  return s + '</svg>';
};

/* ================= ses ================= */
Lab.audio = function () {
  if (!Lab._ac) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) { try { Lab._ac = new AC(); } catch (e) { /* ses yok */ } } }
  if (Lab._ac && Lab._ac.state === 'suspended') { try { Lab._ac.resume(); } catch (e) { /* yoksay */ } }
  return Lab._ac || null;
};
Lab.tone = function (freq, dur, vol, type) {
  const ac = Lab.audio(); if (!ac) return;
  try {
    const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
    o.type = type || 'sine'; o.frequency.value = freq; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol || 0.2, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + dur + 0.05);
  } catch (e) { /* yoksay */ }
};
Lab.buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { /* yoksay */ } };

/* ================= kayıt ================= */
Lab.register = function (def) {
  def.settings = def.settings || [];
  Lab.experiments.push(def); Lab.byId[def.id] = def;
};

/* ================= bağlam (ctx) ================= */
function makeCtx(exp, stageEl, s, run) {
  const display = U.el('div', { class: 'display' }), controls = U.el('div', { class: 'controls' });
  stageEl.replaceChildren(display, controls);
  const ctx = { s, exp, stage: stageEl, display, controls, u: U, test: Lab.test, run };

  function pend(executor) {
    return new Promise((resolve, reject) => {
      if (run.aborted) return reject(new Aborted());
      let cleanup = null, finished = false;
      const entry = { cancel() { if (finished) return; finished = true; cleanup && cleanup(); reject(new Aborted()); } };
      run.pending.add(entry);
      const done = v => { if (finished) return; finished = true; run.pending.delete(entry); cleanup && cleanup(); resolve(v); };
      cleanup = executor(done) || null;
      if (finished && cleanup) { cleanup(); }
    });
  }
  ctx.pend = pend;
  Object.defineProperty(ctx, 'aborted', { get: () => run.aborted });
  ctx.check = () => { if (run.aborted) throw new Aborted(); };
  ctx.sleep = ms => pend(done => {
    const d = Lab.test ? Math.min(ms, 25) : ms;
    const t = setTimeout(done, d);
    return () => clearTimeout(t);
  });
  ctx.frame = () => pend(done => { const id = requestAnimationFrame(done); const to = setTimeout(done, 16); return () => { cancelAnimationFrame(id); clearTimeout(to); }; });
  // kare-hassas bekleme (kısa uyaran süreleri için)
  ctx.wait = ms => pend(done => {
    const targetMs = Lab.test ? Math.min(ms, 25) : ms;
    const t0 = performance.now(); let id, to;
    const tick = () => { const el = performance.now() - t0; if (el >= targetMs - 7) done(el); else id = requestAnimationFrame(tick); };
    id = requestAnimationFrame(tick); to = setTimeout(() => done(performance.now() - t0), targetMs + 30);
    return () => { cancelAnimationFrame(id); clearTimeout(to); };
  });
  ctx.on = (target, type, fn, opt) => { target.addEventListener(type, fn, opt); run.cleanups.push(() => target.removeEventListener(type, fn, opt)); };
  ctx.cleanup = fn => run.cleanups.push(fn);

  ctx.show = c => {
    if (typeof c === 'string') display.innerHTML = c; else display.replaceChildren(...[].concat(c));
    return display;
  };
  ctx.clear = () => { display.replaceChildren(); controls.replaceChildren(); delete controls.dataset.managed; };
  ctx.setBg = (bg, dark) => { stageEl.style.background = bg || ''; stageEl.classList.toggle('dark', !!dark); };
  ctx.setControls = (...kids) => { controls.replaceChildren(...kids.flat()); };
  ctx.hud = html => { let h = stageEl.querySelector('.hud'); if (!h) { h = U.el('div', { class: 'hud' }); display.after(h); } h.innerHTML = html; return h; };
  ctx.progress = (i, n) => {
    let p = stageEl.querySelector('.progress');
    if (!p) { p = U.el('div', { class: 'progress' }, U.el('i')); stageEl.prepend(p); }
    p.firstChild.style.width = (100 * i / n) + '%';
  };

  ctx.waitChoice = (options, o = {}) => pend(done => {
    controls.replaceChildren(); controls.classList.toggle('grid', o.layout === 'grid');
    let finished = false, t0 = performance.now(), tm = null, bt = null;
    const finish = (value, key, timedOut) => {
      if (finished) return; finished = true; const rt = performance.now() - t0;
      if (!o.keep) controls.replaceChildren();
      delete controls.dataset.managed;
      done({ value, rt, key: key || null, timedOut: !!timedOut });
    };
    const btns = options.map(op => {
      const b = U.el('button', { type: 'button', class: 'btn choice ' + (op.cls || ''), 'data-value': String(op.value), style: op.style, html: op.html != null ? op.html : U.esc(op.label), 'aria-label': op.aria || null });
      b.addEventListener('click', () => finish(op.value, null)); return b;
    });
    controls.append(...btns);
    const onKey = e => {
      if (e.repeat || /INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '')) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const op = options.find(x => (x.key && x.key.toLowerCase() === k.toLowerCase()) || (x.keys && x.keys.some(kk => kk.toLowerCase() === k.toLowerCase())));
      if (op) { e.preventDefault(); finish(op.value, k); }
    };
    window.addEventListener('keydown', onKey);
    requestAnimationFrame(() => { t0 = performance.now(); });
    if (o.timeout) tm = setTimeout(() => finish(null, null, true), o.timeout);
    if (Lab.test) {
      controls.dataset.managed = '1';
      const pick = (Lab.botMode === 'smart' && o.botPick !== undefined) ? o.botPick : U.pick(options).value;
      bt = setTimeout(() => finish(pick, null), U.int(40, 120));
    }
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(tm); clearTimeout(bt); };
  });
  ctx.waitTap = (o = {}) => pend(done => {
    const target = o.target || stageEl, keys = o.keys || [' ', 'Enter']; let t0 = performance.now(), tm = null, bt = null;
    const fin = (extra) => done(Object.assign({ rt: performance.now() - t0 }, extra));
    const onDown = e => { if (e.target.closest && e.target.closest('button,a,input,select')) return; fin({ x: e.clientX, y: e.clientY, key: null }); };
    const onKey = e => { if (e.repeat) return; if (keys.includes(e.key)) { e.preventDefault(); fin({ key: e.key }); } };
    target.addEventListener('pointerdown', onDown); window.addEventListener('keydown', onKey);
    requestAnimationFrame(() => { t0 = performance.now(); });
    if (o.timeout) tm = setTimeout(() => fin({ timedOut: true }), o.timeout);
    if (Lab.test) bt = setTimeout(() => fin({ key: ' ' }), U.int(40, 120));
    return () => { target.removeEventListener('pointerdown', onDown); window.removeEventListener('keydown', onKey); clearTimeout(tm); clearTimeout(bt); };
  });
  ctx.message = async (html, label, o = {}) => {
    ctx.show(`<div class="msg ${o.center ? 'center' : ''}">${html}</div>`);
    await ctx.waitChoice([{ label: label || 'Başla', value: true, keys: ['Enter', ' '], cls: 'primary big' }], { botPick: true });
    audioKick();
  };
  ctx.countdown = async (n = 3) => {
    for (let i = n; i > 0; i--) { ctx.show(`<div class="big">${i}</div>`); controls.replaceChildren(); await ctx.sleep(Lab.test ? 20 : 700); }
  };
  ctx.form = (html, o = {}) => pend(done => {
    const f = U.el('form', { class: 'qform', novalidate: '' });
    f.innerHTML = html + `<div class="err" role="alert"></div><button class="btn primary big" type="submit">${U.esc(o.submit || 'Devam')}</button>`;
    display.replaceChildren(f); controls.replaceChildren();
    f.addEventListener('submit', e => {
      e.preventDefault(); const fd = new FormData(f), data = {};
      for (const [k, v] of fd.entries()) { if (k in data) data[k] = [].concat(data[k], v); else data[k] = v; }
      const err = o.validate ? o.validate(data) : null;
      if (err) { f.querySelector('.err').textContent = err; return; }
      done(data);
    });
    const first = f.querySelector('input[type=text],input[type=number]'); if (first && !Lab.test && o.focus !== false) setTimeout(() => { try { first.focus({ preventScroll: true }); } catch (e) { /* yoksay */ } }, 50);
    return null;
  });
  ctx.canvas = (W, H, o = {}) => {
    const cv = U.el('canvas'); const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const parent = o.parent || display; if (o.parent) parent.append(cv); else display.replaceChildren(cv);
    const fit = () => {
      const fs = stageEl.closest('.runner') && stageEl.closest('.runner').classList.contains('fs');
      const availW = Math.max(160, (display.clientWidth || stageEl.clientWidth) - 4);
      const maxH = fs ? Math.max(200, window.innerHeight - 190) : Math.max(240, Math.min(window.innerHeight * 0.7, 680));
      const w = Math.min(availW, maxH * W / H, o.maxWidth || 1e5);
      cv.style.width = w + 'px'; cv.style.height = (w * H / W) + 'px';
    };
    fit(); ctx.on(window, 'resize', fit); ctx.on(window, 'orientationchange', fit);
    const obj = { cv, g, W, H, fit, pt: ev => { const r = cv.getBoundingClientRect(); return { x: (ev.clientX - r.left) * W / r.width, y: (ev.clientY - r.top) * H / r.height }; } };
    return obj;
  };
  ctx.animate = fn => pend(done => {
    let id, to, last = performance.now(), start = last, stopped = false;
    const loop = now => {
      if (stopped) return;
      now = (typeof now === 'number' && now > 0) ? now : performance.now();
      const dt = Math.min(0.1, Math.max(0.016, (now - last) / 1000));
      last = now;
      let r;
      try { r = fn((now - start) / 1000, dt, now); }
      catch (e) { stopped = true; run.fail && run.fail(e); return; }
      if (r) { stopped = true; done(r); }
      else {
        id = requestAnimationFrame(loop);
        to = setTimeout(() => loop(performance.now()), Lab.test ? 16 : 40);
      }
    };
    id = requestAnimationFrame(loop);
    to = setTimeout(() => loop(performance.now()), 16);
    return () => { stopped = true; cancelAnimationFrame(id); clearTimeout(to); };
  });
  ctx.speak = (text, o = {}) => pend(done => {
    if (Lab.test || !('speechSynthesis' in window)) { const t = setTimeout(done, Lab.test ? 10 : 800); return () => clearTimeout(t); }
    try {
      const u = new SpeechSynthesisUtterance(text); u.lang = o.lang || 'tr-TR'; u.rate = o.rate || 1;
      const to = setTimeout(done, (o.maxMs || 9000)); u.onend = () => { clearTimeout(to); done(); }; u.onerror = () => { clearTimeout(to); done(); };
      window.speechSynthesis.speak(u);
      return () => { clearTimeout(to); try { window.speechSynthesis.cancel(); } catch (e) { /* yoksay */ } };
    } catch (e) { const t = setTimeout(done, 500); return () => clearTimeout(t); }
  });
  ctx.fullscreen = on => togglePseudoFs(exp, on);
  return ctx;
}
function audioKick() { Lab.audio(); }

/* ================= ayar formu ================= */
function buildSettings(exp, host) {
  const saved = store.get('set.' + exp.id, {}); exp._inputs = {};
  const grid = U.el('div', { class: 'settings-grid' });
  exp.settings.forEach(st => {
    if (st.group) { grid.append(U.el('div', { class: 'grp' }, st.group)); return; }
    const id = `set-${exp.id}-${st.key}`; let inp;
    const val = saved[st.key] !== undefined ? saved[st.key] : st.def;
    if (st.type === 'select') {
      inp = U.el('select', { id });
      st.options.forEach(([v, l]) => inp.append(U.el('option', { value: String(v) }, l)));
      inp.value = String(val);
      if (inp.value !== String(val)) inp.value = String(st.def);
    } else if (st.type === 'checkbox') { inp = U.el('input', { id, type: 'checkbox' }); inp.checked = !!val; }
    else if (st.type === 'text') { inp = U.el('input', { id, type: 'text', value: val, maxlength: st.max || 40, autocomplete: 'off' }); }
    else { inp = U.el('input', { id, type: 'number', inputmode: st.step && st.step < 1 ? 'decimal' : 'numeric', min: st.min, max: st.max, step: st.step || 1, value: val }); }
    inp.addEventListener('change', () => { saveSettings(exp); });
    exp._inputs[st.key] = { inp, st };
    const row = U.el('div', { class: 'row' }, inp, st.unit ? U.el('span', { class: 'unit' }, st.unit) : null);
    grid.append(U.el('div', { class: 'field ' + (st.type === 'checkbox' ? 'chk' : '') },
      U.el('label', { for: id }, st.label), row, st.help ? U.el('div', { class: 'help' }, st.help) : null));
  });
  host.append(grid);
  const acts = U.el('div', { class: 'settings-actions' },
    U.el('button', { type: 'button', class: 'btn small', onclick: () => { resetSettings(exp); } }, '↺ Varsayılana dön'));
  host.append(acts);
}
function readSettings(exp) {
  const s = {};
  exp.settings.forEach(st => {
    if (st.group) return; const { inp } = exp._inputs[st.key];
    if (st.type === 'checkbox') s[st.key] = inp.checked;
    else if (st.type === 'select') { const o = st.options.find(x => String(x[0]) === inp.value); s[st.key] = o ? o[0] : st.def; }
    else if (st.type === 'text') s[st.key] = inp.value.trim();
    else {
      let v = parseFloat(String(inp.value).replace(',', '.')); if (!isFinite(v)) v = st.def;
      if (st.min != null) v = Math.max(st.min, v); if (st.max != null) v = Math.min(st.max, v); s[st.key] = v;
      if (String(v) !== inp.value && document.activeElement !== inp) inp.value = v;
    }
  });
  if (Lab.overrides) Object.assign(s, Lab.overrides);
  return s;
}
function saveSettings(exp) { const o = {}; exp.settings.forEach(st => { if (st.group) return; const { inp } = exp._inputs[st.key]; o[st.key] = st.type === 'checkbox' ? inp.checked : (st.type === 'number' ? parseFloat(inp.value) : inp.value); }); store.set('set.' + exp.id, o); }
function resetSettings(exp) {
  exp.settings.forEach(st => { if (st.group) return; const { inp } = exp._inputs[st.key]; if (st.type === 'checkbox') inp.checked = !!st.def; else inp.value = String(st.def); });
  saveSettings(exp);
}

/* ================= sonuç oluşturma ================= */
function renderResult(host, exp, res, meta) {
  host.replaceChildren();
  const checks = res.checks || [], bad = checks.filter(c => c.ok === false).length, warn = checks.filter(c => c.ok === 'warn').length;
  const cls = bad ? 'bad' : warn ? 'warn' : 'ok';
  host.append(U.el('div', { class: 'verdict ' + cls }, bad ? `⚠️ Doğrulama: ${bad} sorun var – sonuçlar güvenilir olmayabilir.` : warn ? `🟡 Doğrulama: test tamamlandı, ${warn} uyarı var.` : '✅ Doğrulama: test kurallarına uygun şekilde yapıldı.'));
  if (res.summary && res.summary.length) host.append(U.el('div', { class: 'cards' }, res.summary.map(c =>
    U.el('div', { class: 'stat' }, U.el('b', null, String(c.value)), U.el('span', null, c.label), c.hint ? U.el('small', null, c.hint) : null))));
  if (checks.length) {
    host.append(U.el('h3', null, '🔍 Doğru yaptım mı? – Kontrol listesi'));
    host.append(U.el('ul', { class: 'checks' }, checks.map(c => U.el('li', { class: c.ok === true ? 'ok' : c.ok === false ? 'bad' : 'warn' }, U.el('b', null, c.label), c.detail ? U.el('small', null, c.detail) : null))));
  }
  if (res.charts && res.charts.length) host.append(U.el('div', { class: 'charts' }, res.charts.map(c => U.el('figure', { class: 'fig' }, U.el('figcaption', null, c.title), U.el('div', { html: c.svg })))));
  if (res.interpretation) host.append(U.el('div', { class: 'interp', html: '<b>📝 Yorum</b>' + res.interpretation }));
  if (res.trials && res.trials.length) {
    const cols = []; res.trials.forEach(r => Object.keys(r).forEach(k => { if (!cols.includes(k)) cols.push(k); }));
    const rows = res.trials.slice(0, 400);
    const tbl = U.el('table', { class: 't' }, U.el('thead', null, U.el('tr', null, cols.map(c => U.el('th', null, c)))),
      U.el('tbody', null, rows.map(r => U.el('tr', null, cols.map(c => U.el('td', null, r[c] == null ? '' : typeof r[c] === 'number' ? U.fmt(r[c], Number.isInteger(r[c]) ? 0 : 1) : String(r[c])))))));
    host.append(U.el('details', { class: 'trials' }, U.el('summary', { style: { cursor: 'pointer', fontWeight: 700 } }, `📋 Deneme kayıtları (${res.trials.length})`), U.el('div', { class: 'table-wrap' }, tbl)));
  }
  const acts = U.el('div', { class: 'res-actions' });
  if (res.trials && res.trials.length) acts.append(U.el('button', { type: 'button', class: 'btn small', onclick: () => U.download(`${exp.id}-denemeler.csv`, U.toCSV(res.trials)) }, '⬇ CSV indir'));
  acts.append(U.el('button', { type: 'button', class: 'btn small', onclick: () => U.download(`${exp.id}-sonuc.json`, JSON.stringify({ deney: exp.title, tarih: meta && meta.ts, ayarlar: meta && meta.s, ozet: res.summary, kontroller: checks, denemeler: res.trials }, null, 1), 'application/json') }, '⬇ JSON indir'));
  host.append(acts);
  if (meta && meta.s) {
    const lines = exp.settings.filter(st => !st.group && meta.s[st.key] !== undefined).map(st => `${st.label}: ${st.type === 'select' ? ((st.options.find(o => o[0] === meta.s[st.key]) || [0, meta.s[st.key]])[1]) : typeof meta.s[st.key] === 'boolean' ? (meta.s[st.key] ? 'evet' : 'hayır') : meta.s[st.key]}${st.unit ? ' ' + st.unit : ''}`);
    host.append(U.el('details', { class: 'settings-used' }, U.el('summary', null, 'Bu testte kullanılan ayarlar'), U.el('div', null, lines.join(' · '))));
  }
}
function saveHistory(exp, s, res) {
  const key = 'hist.' + exp.id, h = store.get(key, []);
  const entry = { ts: Date.now(), s, res: Object.assign({}, res, { trials: (res.trials || []).slice(0, 300) }) };
  h.unshift(entry); while (h.length > 5) h.pop();
  while (h.length && !store.set(key, h)) { h.pop(); if (!h.length) break; }
  return entry;
}
function renderHistory(exp) {
  const p = exp._panel, list = p.hist, h = store.get('hist.' + exp.id, []);
  list.replaceChildren();
  if (!h.length) { list.append(U.el('p', { class: 'empty' }, 'Henüz kayıtlı sonuç yok.')); return; }
  const ul = U.el('ul', { class: 'hist' });
  h.forEach((e, i) => {
    const checks = e.res.checks || [], c = checks.some(x => x.ok === false) ? 'bad' : checks.some(x => x.ok === 'warn') ? 'warn' : 'ok';
    ul.append(U.el('li', null, U.el('span', { class: 'dot ' + c }), new Date(e.ts).toLocaleString('tr-TR'),
      U.el('span', { class: 'stat-line' }, (e.res.summary || []).slice(0, 3).map(x => `${x.label}: ${x.value}`).join(' · ')),
      U.el('button', { type: 'button', class: 'btn small', onclick: () => { renderResult(p.resBody, exp, e.res, e); p.resBody.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }, 'Göster')));
  });
  list.append(ul, U.el('button', { type: 'button', class: 'btn small danger', onclick: () => { if (confirm('Bu testin tüm kayıtları silinsin mi?')) { store.del('hist.' + exp.id); renderHistory(exp); updateTabs(); } } }, 'Kayıtları sil'));
}

/* ================= arayüz iskeleti ================= */
function buildUI() {
  const tabs = document.getElementById('tabs'), app = document.getElementById('app');
  Lab.experiments.forEach((exp, i) => {
    const tab = U.el('button', { type: 'button', class: 'tab', role: 'tab', id: 'tab-' + exp.id, 'aria-controls': 'panel-' + exp.id, 'aria-selected': 'false', onclick: () => Lab.select(exp.id) },
      U.el('span', null, exp.icon), U.el('span', null, exp.short || exp.title), U.el('span', { class: 'n' }, String(i + 1)));
    tabs.append(tab); exp._tab = tab;
    const p = {};
    p.stage = U.el('div', { class: 'stage' });
    p.status = U.el('span', { class: 'status' }, '');
    p.startBtn = U.el('button', { type: 'button', class: 'btn primary', onclick: () => Lab.start(exp) }, '▶ Başlat');
    p.stopBtn = U.el('button', { type: 'button', class: 'btn danger', disabled: true, onclick: () => Lab.stop() }, '■ Durdur');
    p.fsBtn = U.el('button', { type: 'button', class: 'btn', onclick: () => togglePseudoFs(exp) }, '⛶ Tam ekran');
    p.runner = U.el('div', { class: 'card runner' }, U.el('div', { class: 'bar' }, p.startBtn, p.stopBtn, p.fsBtn, p.status), p.stage);
    p.resBody = U.el('div', { class: 'result-body' }, U.el('p', { class: 'empty' }, 'Test bittiğinde sonuçlar ve doğrulama burada görünür.'));
    p.hist = U.el('div', { class: 'history' });
    const info = U.el('details', { class: 'card info', open: true }, U.el('summary', null, '📖 Deney hakkında ve nasıl yapılır'),
      U.el('div', { class: 'body', html: `<h3>Ne ölçüyor?</h3>${exp.about}<h3>Nasıl yapılır?</h3>${exp.howto}<h3>Doğruluk nasıl kontrol edilir?</h3>${exp.verify || '<p>Test sonunda kontrol listesi gösterilir.</p>'}${exp.refs ? `<p class="refs">${exp.refs}</p>` : ''}` }));
    const setDet = U.el('details', { class: 'card settings', open: true }, U.el('summary', null, '⚙️ Ayarlar (süre, sayı ve diğer değişkenler)'));
    const setBody = U.el('div', { class: 'body' }); setDet.append(setBody); buildSettings(exp, setBody);
    const res = U.el('div', { class: 'card results' }, U.el('h3', null, '📊 Sonuçlar ve doğrulama'), p.resBody, U.el('h3', { style: { marginTop: '14px' } }, '🕘 Önceki denemeler'), p.hist);
    const panel = U.el('section', { class: 'panel', id: 'panel-' + exp.id, role: 'tabpanel', 'aria-labelledby': 'tab-' + exp.id, hidden: true },
      U.el('div', { class: 'panel-head' }, U.el('h2', null, `${exp.icon} ${exp.title}`), U.el('p', { class: 'tag' }, U.el('span', { class: 'chip' }, exp.group), exp.tagline)),
      info, setDet, p.runner, res);
    app.append(panel); p.panel = panel; exp._panel = p;
    idle(exp); renderHistory(exp);
    if (window.innerWidth < 700) { info.open = false; }
  });
  updateTabs();
}
function idle(exp) {
  const p = exp._panel; p.stage.replaceChildren(U.el('div', { class: 'idle' }, U.el('span', { class: 'em' }, exp.icon), 'Ayarları gözden geçirip ', U.el('b', null, '▶ Başlat'), ' düğmesine basın.'));
  p.stage.style.background = ''; p.stage.classList.remove('dark');
}
function updateTabs() {
  Lab.experiments.forEach(exp => exp._tab.classList.toggle('done', store.get('hist.' + exp.id, []).length > 0));
}
function togglePseudoFs(exp, force) {
  const r = exp._panel.runner, on = force !== undefined ? force : !r.classList.contains('fs');
  r.classList.toggle('fs', on); document.body.style.overflow = on ? 'hidden' : '';
  exp._panel.fsBtn.textContent = on ? '✕ Tam ekrandan çık' : '⛶ Tam ekran';
  window.dispatchEvent(new Event('resize'));
}
Lab.select = function (id, fromHash) {
  if (!Lab.byId[id]) id = Lab.experiments[0].id;
  if (Lab.run) Lab.stop();
  Lab.experiments.forEach(exp => {
    const on = exp.id === id; exp._panel.panel.hidden = !on; exp._tab.setAttribute('aria-selected', on ? 'true' : 'false');
    if (!on && exp._panel.runner.classList.contains('fs')) togglePseudoFs(exp, false);
  });
  Lab.current = Lab.byId[id];
  if (!fromHash) { try { history.replaceState(null, '', '#' + id); } catch (e) { /* yoksay */ } }
  try { Lab.current._tab.scrollIntoView({ inline: 'center', block: 'nearest' }); } catch (e) { /* yoksay */ }
  window.scrollTo(0, 0);
};

/* ================= çalıştırma ================= */
function setRunning(exp, on) {
  const p = exp._panel; p.startBtn.disabled = on; p.stopBtn.disabled = !on; p.status.textContent = on ? '● çalışıyor' : '';
  document.querySelectorAll('.tab').forEach(t => { /* sekmeler çalışırken de serbest: geçişte test durdurulur */ });
}
Lab.stop = function () {
  const run = Lab.run; if (!run) return;
  run.aborted = true; run.pending.forEach(e => e.cancel()); run.pending.clear();
};
Lab.start = async function (exp) {
  if (Lab.run) Lab.stop();
  const p = exp._panel, s = readSettings(exp);
  Lab.audio();
  const run = { exp, aborted: false, pending: new Set(), cleanups: [], failure: null };
  run.fail = e => { run.failure = e; Lab.stop(); };
  Lab.run = run; setRunning(exp, true);
  p.stage.style.background = ''; p.stage.classList.remove('dark');
  const ctx = makeCtx(exp, p.stage, s, run);
  const botTimer = Lab.test ? startBot(p.stage, run) : null;
  let result = null, err = null; const t0 = performance.now();
  try { result = await exp.run(ctx); } catch (e) { if (!(e instanceof Aborted)) err = e; }
  if (run.failure && !err) err = run.failure;
  run.cleanups.forEach(f => { try { f(); } catch (e) { /* yoksay */ } });
  if (botTimer) clearInterval(botTimer);
  try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) { /* yoksay */ }
  Lab.run = null; setRunning(exp, false);
  togglePseudoFs(exp, false);
  const out = { exp: exp.id, ms: performance.now() - t0 };
  if (err) {
    Lab.errors.push({ exp: exp.id, message: String(err && err.message || err), stack: String(err && err.stack || '') });
    console.error(err); out.error = err;
    p.stage.replaceChildren(U.el('div', { class: 'msg' }, U.el('h3', null, '⚠️ Bir hata oluştu'), U.el('p', null, String(err && err.message || err)), U.el('button', { class: 'btn', type: 'button', onclick: () => idle(exp) }, 'Tamam')));
    return out;
  }
  if (run.aborted || !result) { p.stage.replaceChildren(U.el('div', { class: 'idle' }, U.el('span', { class: 'em' }, '⏹'), 'Test durduruldu. Sonuç kaydedilmedi.')); out.aborted = true; return out; }
  const meta = saveHistory(exp, s, result);
  renderResult(p.resBody, exp, result, meta); renderHistory(exp); updateTabs();
  p.stage.replaceChildren(U.el('div', { class: 'idle' }, U.el('span', { class: 'em' }, '✅'), U.el('b', null, 'Test tamamlandı.'), U.el('br'), 'Sonuçlar aşağıda. Yeniden başlatabilirsiniz.'));
  p.stage.style.background = ''; p.stage.classList.remove('dark');
  if (!Lab.test) setTimeout(() => p.resBody.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  out.result = result; return out;
};

/* ================= otomatik oyuncu (self-test) ================= */
const BOT_KEYS = [' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'f', 'j', 'Enter', '1', '2', '3'];
function fillForm(f) {
  const groups = {};
  f.querySelectorAll('input,select,textarea').forEach(el => {
    const t = el.type;
    if (t === 'radio') { (groups[el.name] = groups[el.name] || []).push(el); return; }
    if (t === 'checkbox') el.checked = Math.random() < 0.5;
    else if (t === 'number') { const mn = el.min !== '' ? +el.min : 0, mx = el.max !== '' ? +el.max : mn + 10; el.value = U.int(mn, mx); }
    else if (t === 'text') el.value = el.value || 'Ali';
    else if (el.tagName === 'SELECT') { const o = [...el.options].filter(x => x.value !== ''); if (o.length) el.value = U.pick(o).value; }
    el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  Object.values(groups).forEach(g => { const r = U.pick(g); r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); });
}
function startBot(stage, run) {
  return setInterval(() => {
    if (run.aborted) return;
    const form = stage.querySelector('form');
    if (form) { fillForm(form); const sb = form.querySelector('[type=submit]'); if (sb) sb.click(); return; }
    const cv = stage.querySelector('canvas');
    if (cv && Math.random() < 0.6) {
      const r = cv.getBoundingClientRect(), x = r.left + Math.random() * r.width, y = r.top + Math.random() * r.height;
      const opt = { clientX: x, clientY: y, bubbles: true, pointerId: 1, isPrimary: true };
      try { cv.dispatchEvent(new PointerEvent('pointerdown', opt)); cv.dispatchEvent(new PointerEvent('pointerup', opt)); } catch (e) { /* yoksay */ }
    }
    const btns = [...stage.querySelectorAll('button:not([disabled]):not(.no-bot)')].filter(b => !b.closest('[data-managed]'));
    if (btns.length && Math.random() < 0.5) U.pick(btns).click();
    if (!stage.querySelector('[data-managed]') && Math.random() < 0.5) {
      const key = U.pick(BOT_KEYS);
      window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })); setTimeout(() => window.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true })), 120);
    }
  }, 80);
}

Lab.selftest = async function () {
  Lab.test = true;
  const out = []; const errs = [];
  window.addEventListener('error', e => errs.push(String(e.message)));
  window.addEventListener('unhandledrejection', e => errs.push('rejection: ' + String(e.reason && e.reason.message || e.reason)));
  const only = new URLSearchParams(location.search).get('only');
  for (const exp of Lab.experiments) {
    if (only && !only.split(',').includes(exp.id)) continue;
    Lab.select(exp.id); Lab.overrides = Object.assign({}, exp.testSettings || {});
    const n0 = errs.length, rec = { id: exp.id, status: 'PASS', notes: [] };
    let tm; const timeout = new Promise(r => { tm = setTimeout(() => r({ timeout: true }), 120000); });
    const r = await Promise.race([Lab.start(exp), timeout]); clearTimeout(tm);
    if (r.timeout) { Lab.stop(); rec.status = 'FAIL'; rec.notes.push('ZAMAN AŞIMI (120 sn sanal süre)'); }
    else if (r.error) { rec.status = 'FAIL'; rec.notes.push('HATA: ' + (r.error.stack || r.error.message)); }
    else if (!r.result) { rec.status = 'FAIL'; rec.notes.push('sonuç üretilmedi'); }
    else {
      const res = r.result; rec.ms = Math.round(r.ms);
      if (!res.summary || !res.summary.length) { rec.status = 'FAIL'; rec.notes.push('özet boş'); }
      if (!res.checks || !res.checks.length) rec.notes.push('uyarı: kontrol listesi boş');
      rec.summary = (res.summary || []).slice(0, 4).map(x => x.label + '=' + x.value);
      rec.checks = (res.checks || []).map(c => (c.ok === true ? '✔ ' : c.ok === false ? '✘ ' : '~ ') + c.label);
      if (exp.expectOk) { const f = exp.expectOk(res); if (f) { rec.status = 'FAIL'; rec.notes.push('akıllı-bot beklentisi: ' + f); } }
    }
    if (exp.unit) { try { const fails = exp.unit().filter(u => !u[1]).map(u => u[0]); if (fails.length) { rec.status = 'FAIL'; rec.notes.push('birim testi başarısız: ' + fails.join(', ')); } else rec.unit = 'ok'; } catch (e) { rec.status = 'FAIL'; rec.notes.push('birim testi hata: ' + e.message); } }
    if (errs.length > n0) { rec.status = 'FAIL'; rec.notes.push('JS hataları: ' + errs.slice(n0).join(' | ')); }
    if (Lab.errors.length) { rec.notes.push('Lab.errors: ' + JSON.stringify(Lab.errors.map(e => e.message))); Lab.errors.length = 0; }
    out.push(rec);
  }
  Lab.overrides = null;
  window.__selftest = out;
  const pass = out.filter(o => o.status === 'PASS').length;
  const pre = document.createElement('pre'); pre.id = 'selftest-out';
  pre.textContent = `SELFTEST ${pass}/${out.length} PASS\n` + JSON.stringify(out, null, 1);
  document.body.append(pre); document.title = `SELFTEST ${pass}/${out.length}`;
  return out;
};

Lab.init = function () {
  buildUI();
  const h = location.hash.slice(1);
  Lab.select(Lab.byId[h] ? h : Lab.experiments[0].id, true);
  window.addEventListener('hashchange', () => { const id = location.hash.slice(1); if (Lab.byId[id] && (!Lab.current || Lab.current.id !== id)) Lab.select(id, true); });
  window.addEventListener('keydown', e => { if (e.key === 'Escape' && Lab.current && Lab.current._panel.runner.classList.contains('fs') && !Lab.run) togglePseudoFs(Lab.current, false); });
  // iOS çift dokunuşla yakınlaştırmayı engelle
  let lastTouch = 0; document.addEventListener('touchend', e => { const n = Date.now(); if (n - lastTouch < 300 && e.target.closest && e.target.closest('.stage')) e.preventDefault(); lastTouch = n; }, { passive: false });
  if (new URLSearchParams(location.search).has('selftest')) Lab.selftest();
};
})();
