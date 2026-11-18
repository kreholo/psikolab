/* Ortak bileşen: iki akışlı (sol/sağ) görsel seçici dikkat düzeneği.
   Moray, MacKay ve Sevgili Jane Teyze deneylerinde kullanılır. */
(function () {
'use strict';
const U = Lab.u;

Lab.dual = {
  layout(ctx, o = {}) {
    const left = U.el('div', { class: 'side' + (o.attend === 'left' ? ' attend' : '') }, U.el('small', null, 'SOL')),
      right = U.el('div', { class: 'side' + (o.attend === 'right' ? ' attend' : '') }, U.el('small', null, 'SAĞ')),
      fix = U.el('div', { class: 'mid-fix' }, '+');
    const root = U.el('div', { class: 'dual' }, left, fix, right);
    ctx.show(root);
    const word = U.el('span'), word2 = U.el('span');
    left.append(word); right.append(word2);
    const set = (el, text, style) => { el.textContent = text || ''; el.style.color = (style && style.color) || ''; el.style.textDecoration = (style && style.underline) ? 'underline' : ''; };
    return {
      root, left, right, fix,
      setLeft: (t, st) => set(word, t, st), setRight: (t, st) => set(word2, t, st),
      clear() { set(word, ''); set(word2, ''); }
    };
  },

  /* cfg: { attended:[{text,target,color}], unattended:[{text}], side:'left'|'right', soa, stimMs,
            monitor:true, btnLabel:'Hedef!' }
     Döner: { n, targets, hits, fas, rts, onsets } */
  async stream(ctx, cfg) {
    const side = cfg.side, L = this.layout(ctx, { attend: cfg.showFrame === false ? null : side });
    const n = cfg.attended.length, soa = cfg.soa, stimMs = Math.min(cfg.stimMs, soa - 50);
    const responses = [], onsets = []; let alive = true;
    const respond = () => { if (alive) responses.push(performance.now()); };
    if (cfg.monitor !== false) {
      const b = U.el('button', { type: 'button', class: 'btn primary big', 'aria-label': cfg.btnLabel || 'Hedef' }, cfg.btnLabel || 'Hedef!');
      b.addEventListener('pointerdown', e => { e.preventDefault(); respond(); });
      b.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') e.preventDefault(); });
      ctx.setControls(b);
      ctx.on(window, 'keydown', e => { if (e.key === ' ' && !e.repeat) { e.preventDefault(); respond(); } });
      b.addEventListener('click', e => { if (e.detail === 0 && !Lab.test) return; if (Lab.test) respond(); });
    } else ctx.setControls();
    ctx.hud(cfg.hud || '');
    await ctx.sleep(Lab.test ? 30 : 700);
    for (let i = 0; i < n; i++) {
      const a = cfg.attended[i], u = cfg.unattended[i] || { text: '' };
      const aSt = a.color ? { color: a.color } : null;
      if (side === 'left') { L.setLeft(a.text, aSt); L.setRight(u.text); } else { L.setRight(a.text, aSt); L.setLeft(u.text); }
      const t = performance.now(); onsets.push(t);
      if (Lab.test && Lab.botMode === 'smart' && a.target) setTimeout(respond, 10);
      await ctx.wait(stimMs); L.clear(); await ctx.wait(soa - stimMs);
    }
    await ctx.sleep(Lab.test ? 30 : 500);
    alive = false;
    const win = Lab.test ? [0, 5000] : [150, soa + 600]; let hits = 0; const rts = []; const used = new Set();
    cfg.attended.forEach((a, i) => {
      if (!a.target) return;
      const r = responses.findIndex((t, k) => !used.has(k) && t - onsets[i] >= win[0] && t - onsets[i] <= win[1]);
      if (r >= 0) { used.add(r); hits++; rts.push(responses[r] - onsets[i]); }
    });
    const targets = cfg.attended.filter(a => a.target).length;
    return { n, targets, hits, fas: responses.length - used.size, rts, onsets };
  }
};
})();
