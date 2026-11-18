(function () {
'use strict';
const U = Lab.u;
const NAMES = ['Glip', 'Plok', 'Tasa', 'Vimu', 'Zeno', 'Barg', 'Fidu', 'Kolo', 'Nema', 'Ruti'];
const HUES = [8, 48, 140, 210, 285];
const SHAPE = { n: [2, 2.7, 1.2, 4, 1.8], a: [20, 26, 21, 22, 18], b: [26, 20, 25, 22, 28] };

// Greeble = aile (gövde şekli/rengi) × cinsiyet (kolların yönü). Aşağıdaki çizim tamamen rastgele değil, bireyi belirler.
function drawGreeble(g, ind, S, inverted) {
  const f = ind.f, gd = ind.gd, hue = HUES[f % 5], col = `hsl(${hue},62%,56%)`, dark = `hsl(${hue},62%,32%)`;
  g.save(); g.clearRect(0, 0, S, S); g.fillStyle = '#fff'; g.fillRect(0, 0, S, S);
  g.translate(S / 2, S / 2); if (inverted) g.rotate(Math.PI); g.scale(S / 100, S / 100); g.translate(-50, -50);
  g.lineCap = 'round'; g.strokeStyle = dark; g.fillStyle = dark;
  const dir = gd === 0 ? -1 : 1, len = 20 + (f % 3) * 5;
  [-1, 1].forEach(side => {                       // "boge" kolları
    const x1 = 50 + side * 15, y1 = 52, x2 = 50 + side * (15 + len * 0.75), y2 = 52 + dir * len;
    g.lineWidth = 7; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    if (f % 2 === 0) { g.beginPath(); g.arc(x2, y2, 5.5, 0, 7); g.fill(); } else g.fillRect(x2 - 5, y2 - 5, 10, 10);
  });
  g.lineWidth = 6; g.beginPath(); g.moveTo(50, 36); g.lineTo(50, 36 - (11 + (f % 3) * 4)); g.stroke();                 // quiff
  g.lineWidth = 6; g.beginPath(); g.moveTo(50, 74); g.lineTo(50, 74 + 9 + ((f + gd) % 3) * 4); g.stroke();             // dunth
  g.beginPath();
  for (let i = 0; i <= 80; i++) {
    const t = i / 80 * Math.PI * 2, c = Math.cos(t), s = Math.sin(t), e = 2 / SHAPE.n[f % 5];
    const x = 50 + SHAPE.a[f % 5] * Math.sign(c) * Math.pow(Math.abs(c), e), y = 55 + SHAPE.b[f % 5] * Math.sign(s) * Math.pow(Math.abs(s), e);
    i ? g.lineTo(x, y) : g.moveTo(x, y);
  }
  g.closePath(); g.fillStyle = col; g.fill(); g.lineWidth = 2.5; g.strokeStyle = dark; g.stroke();
  g.fillStyle = dark; g.beginPath(); g.ellipse(50, 55, 7, 4 + gd * 3, 0, 0, 7); g.fill();
  g.restore();
}
function mask(g, S) { g.fillStyle = '#fff'; g.fillRect(0, 0, S, S); const r = U.rng(Date.now() & 0xffff); for (let i = 0; i < 90; i++) { g.fillStyle = `hsl(${r() * 360},40%,${40 + r() * 40}%)`; g.fillRect(r() * S, r() * S, 12 + r() * 26, 12 + r() * 26); } }

function makeInds(nFam) { const a = []; for (let f = 0; f < nFam; f++) for (let gd = 0; gd < 2; gd++) a.push({ f, gd, name: NAMES[a.length] }); return a; }
function pairs(inds, n) {
  const list = [];
  for (let i = 0; i < n; i++) {
    const same = i % 2 === 0, a = U.pick(inds); let b = a;
    if (!same) { const sameFam = inds.filter(x => x !== a && x.f === a.f), others = inds.filter(x => x !== a); b = (Math.random() < 0.5 && sameFam.length) ? U.pick(sameFam) : U.pick(others); }
    list.push({ a, b, same, inverted: Math.floor(i / 2) % 2 === 1 });
  }
  return U.shuffle(list);
}

Lab.register({
  id: 'greeble', icon: '👾', short: 'Greeble', title: 'Gauthier (1998) – Greeble uzmanlık eğitimi', group: 'Algı / Deneyim',
  tagline: 'Uzmanlaşma, yüz-benzeri “baş aşağı” (ters çevirme) etkisini oluşturur mu?',
  about: `<p><b>Gauthier ve Tarr</b> “Greeble” adı verilen yapay yaratıkları kullandı. Greebleler <b>aile</b> (gövde) ve <b>cinsiyet</b> (kolların yönü) bakımından farklıdır.
  Katılımcılar Greeble bireylerini <b>adlarıyla</b> tanıma konusunda uzmanlaştıkça, yüzlerde görülen özellikler ortaya çıktı: <b>ters çevirme etkisi</b> (baş aşağı tanıma çok daha zor) ve bütünsel işleme.
  Bu, “yüz işlemenin özel bir modül mü yoksa bireysel düzeyde uzmanlık mı olduğu” tartışmasında önemli bir kanıttır.</p>`,
  howto: `<ol><li><b>Ön test:</b> iki Greeble art arda gösterilir; <i>aynı birey mi?</i> (dik ve ters çevrilmiş denemeler karışık).</li><li><b>Eğitim:</b> 10 Greeble bireyini adlarıyla öğrenirsiniz (isim seçme, geri bildirimli).</li>
  <li><b>Son test:</b> ön testin aynısı. Ters çevirme etkisi (ters RT − dik RT) eğitimden sonra büyüyor mu?</li></ol><p>Kısayol: <kbd>A</kbd> = aynı, <kbd>F</kbd> = farklı.</p>`,
  verify: `<ul><li>Ön/son test doğruluğu şans düzeyinin (%50) belirgin üstünde olmalı.</li><li>Eğitim bloklarında doğruluk artmalı (öğrenme gerçekleşmiş olmalı).</li><li>Her hücrede (dik/ters × ön/son) yeterli doğru deneme aranır.</li></ul>`,
  refs: 'Gauthier, I., & Tarr, M. J. (1997). Becoming a "Greeble" expert. Vision Research, 37, 1673–1682. · Gauthier et al. (1998) Nature Neuroscience, 1, 568–573.',
  settings: [
    { group: 'Yapı' },
    { key: 'nFam', label: 'Aile sayısı (birey = aile × 2)', type: 'number', def: 5, min: 2, max: 5 },
    { key: 'preN', label: 'Ön test deneme sayısı', type: 'number', def: 16, min: 4, max: 80, step: 4 },
    { key: 'blocks', label: 'Eğitim blok sayısı', type: 'number', def: 3, min: 1, max: 20 },
    { key: 'perBlock', label: 'Eğitim blok başına deneme', type: 'number', def: 20, min: 4, max: 80 },
    { key: 'postN', label: 'Son test deneme sayısı', type: 'number', def: 16, min: 4, max: 80, step: 4 },
    { group: 'Zamanlama' },
    { key: 'firstMs', label: 'İlk Greeble süresi', type: 'number', def: 500, min: 100, max: 3000, step: 50, unit: 'ms' },
    { key: 'maskMs', label: 'Maske süresi', type: 'number', def: 300, min: 0, max: 2000, step: 50, unit: 'ms' },
    { key: 'studySec', label: 'İsim öğrenme ekranı (en az)', type: 'number', def: 15, min: 0, max: 120, unit: 'sn' },
    { key: 'fbMs', label: 'Eğitimde geri bildirim süresi', type: 'number', def: 700, min: 100, max: 3000, step: 100, unit: 'ms' }
  ],
  testSettings: { preN: 8, blocks: 2, perBlock: 6, postN: 8, firstMs: 40, maskMs: 20, studySec: 0, fbMs: 50 },
  expectOk: r => r.meta.prePostAcc === 1 ? null : 'akıllı bot ön/son testi %100 doğru yapmalıydı: ' + r.meta.prePostAcc,
  unit() {
    const inds = makeInds(5), p = pairs(inds, 40), c = document.createElement('canvas'); c.width = c.height = 50; drawGreeble(c.getContext('2d'), inds[0], 50, true);
    return [['10 birey', inds.length === 10], ['aynı çiftler gerçekten aynı', p.filter(x => x.same).every(x => x.a === x.b)], ['farklı çiftler gerçekten farklı', p.filter(x => !x.same).every(x => x.a !== x.b)],
      ['yarısı ters', p.filter(x => x.inverted).length === 20]];
  },
  async run(ctx) {
    const s = ctx.s, inds = makeInds(s.nFam), S = 220, rows = [];
    const C = ctx.canvas(S, S, { maxWidth: 240 });
    const runMatch = async (phase, n) => {
      await ctx.message(`<h3>${phase} testi</h3><p>İki Greeble art arda gösterilecek. İkincisi <b>birincisiyle aynı birey</b> mi?</p><p><b>A</b> = Aynı · <b>F</b> = Farklı (veya düğmeler)</p>`, 'Başla');
      const list = pairs(inds, n); let i = 0;
      for (const t of list) {
        ctx.show(C.cv); ctx.setControls(); drawGreeble(C.g, t.a, S, t.inverted); await ctx.wait(s.firstMs);
        mask(C.g, S); await ctx.wait(s.maskMs);
        drawGreeble(C.g, t.b, S, t.inverted);
        const r = await ctx.waitChoice([{ label: 'Aynı (A)', value: 'same', key: 'a' }, { label: 'Farklı (F)', value: 'diff', key: 'f' }], { botPick: t.same ? 'same' : 'diff' });
        const ok = (r.value === 'same') === t.same;
        rows.push({ aşama: phase, yön: t.inverted ? 'ters' : 'dik', 'aynı mı': t.same ? 'aynı' : 'farklı', yanıt: r.value === 'same' ? 'aynı' : 'farklı', doğru: ok ? 1 : 0, 'RT (ms)': Math.round(r.rt) });
        ctx.progress(++i, list.length); ctx.clear(); await ctx.wait(250);
      }
    };
    await runMatch('Ön', s.preN);

    // ---- öğrenme ekranı
    const grid = U.el('div', { class: 'greeble-grid' });
    inds.forEach(ind => { const cv = U.el('canvas', { width: 160, height: 160, style: { width: '110px', height: '110px' } }); drawGreeble(cv.getContext('2d'), ind, 160, false); grid.append(U.el('figure', null, cv, U.el('figcaption', null, ind.name))); });
    ctx.show([U.el('div', { class: 'msg center' }, U.el('h3', null, 'Greeble bireyleri ve adları'), U.el('p', null, 'Her Greeble’ı adıyla birlikte ezberleyin: gövde şekli/rengi ve kolların yönü bireyi belirler.')), grid]);
    ctx.setControls();
    for (let k = Math.round(s.studySec); k > 0; k--) { ctx.hud(`Ezberleme süresi: ${k} sn`); await ctx.sleep(1000); }
    ctx.hud('');
    await ctx.waitChoice([{ label: 'Eğitime geç', value: true, cls: 'primary big', keys: ['Enter'] }], { botPick: true });

    // ---- eğitim
    const blockAcc = [];
    for (let b = 0; b < s.blocks; b++) {
      const order = U.shuffle(U.range(s.perBlock).map(i => inds[i % inds.length])); let ok = 0, i = 0;
      for (const ind of order) {
        ctx.show(C.cv); drawGreeble(C.g, ind, S, false);
        const r = await ctx.waitChoice(U.shuffle(inds).map(x => ({ label: x.name, value: x.name })), { layout: 'grid', botPick: ind.name });
        const good = r.value === ind.name; if (good) ok++;
        rows.push({ aşama: 'Eğitim ' + (b + 1), yön: 'dik', 'aynı mı': '', yanıt: r.value, doğru: good ? 1 : 0, 'RT (ms)': Math.round(r.rt) });
        ctx.hud(good ? '<b style="color:#16a34a">✔ Doğru</b>' : `<b style="color:#dc2626">✘ Doğrusu: ${ind.name}</b>`); await ctx.wait(s.fbMs); ctx.hud('');
        ctx.progress(b * s.perBlock + (++i), s.blocks * s.perBlock);
      }
      blockAcc.push(ok / order.length);
      if (b < s.blocks - 1) await ctx.message(`<h3>Blok ${b + 1} bitti</h3><p>Doğruluk: <b>${U.pct(ok / order.length)}</b></p>`, 'Sonraki blok');
    }
    await runMatch('Son', s.postN);

    // ---- analiz
    const cell = (ph, ori) => { const r = rows.filter(x => x.aşama === ph && x.yön === ori), ok = r.filter(x => x.doğru); return { n: r.length, nOk: ok.length, acc: U.mean(r.map(x => x.doğru)), rt: U.mean(ok.map(x => x['RT (ms)'])), sem: U.sem(ok.map(x => x['RT (ms)'])) }; };
    const C1 = cell('Ön', 'dik'), C2 = cell('Ön', 'ters'), C3 = cell('Son', 'dik'), C4 = cell('Son', 'ters');
    const preAcc = U.mean(rows.filter(x => x.aşama === 'Ön').map(x => x.doğru)), postAcc = U.mean(rows.filter(x => x.aşama === 'Son').map(x => x.doğru));
    const ie1 = C2.rt - C1.rt, ie2 = C4.rt - C3.rt;
    const checks = [
      { ok: preAcc >= 0.65 ? true : preAcc > 0.5 ? 'warn' : false, label: `Ön test doğruluğu: ${U.pct(preAcc)}`, detail: 'Şans = %50. ≥ %65 beklenir.' },
      { ok: postAcc >= 0.65 ? true : postAcc > 0.5 ? 'warn' : false, label: `Son test doğruluğu: ${U.pct(postAcc)}`, detail: 'Şans = %50.' },
      { ok: blockAcc[blockAcc.length - 1] >= blockAcc[0] ? true : 'warn', label: `Eğitim doğruluğu: ${blockAcc.map(a => U.pct(a)).join(' → ')}`, detail: 'Bloklar boyunca artması öğrenmeyi gösterir.' },
      { ok: blockAcc[blockAcc.length - 1] >= 0.4 ? true : 'warn', label: 'Eğitim sonunda doğruluk ≥ %40 (10 isimde şans = %10)', detail: 'Düşükse daha fazla blok/deneme ekleyin.' },
      { ok: [C1, C2, C3, C4].every(c => c.nOk >= 3) ? true : 'warn', label: 'Her hücrede ≥ 3 doğru deneme', detail: `Ön dik ${C1.nOk}, ön ters ${C2.nOk}, son dik ${C3.nOk}, son ters ${C4.nOk}` },
      { ok: ie2 > ie1 ? true : 'warn', label: `Ters çevirme etkisi: ön ${U.ms(ie1)} → son ${U.ms(ie2)}`, detail: 'Gauthier: uzmanlıkla ters çevirme etkisi artar. Kısa eğitimde tutarsız olabilir.' }
    ];
    return {
      meta: { prePostAcc: U.mean(rows.filter(x => x.aşama === 'Ön' || x.aşama === 'Son').map(x => x.doğru)) },
      summary: [{ label: 'Ön test doğruluk', value: U.pct(preAcc) }, { label: 'Son test doğruluk', value: U.pct(postAcc) }, { label: 'Ters çevirme etkisi (ön)', value: U.ms(ie1) }, { label: 'Ters çevirme etkisi (son)', value: U.ms(ie2) },
        { label: 'Eğitim son blok', value: U.pct(blockAcc[blockAcc.length - 1]) }],
      checks,
      charts: [{ title: 'Ortalama tepki süresi (ms)', svg: U.svgBars({ labels: ['Ön dik', 'Ön ters', 'Son dik', 'Son ters'], values: [C1.rt, C2.rt, C3.rt, C4.rt], errors: [C1.sem, C2.sem, C3.sem, C4.sem], colors: ['#16a34a', '#ef4444', '#16a34a', '#ef4444'], unit: 'ms' }) },
        { title: 'Doğruluk (%)', svg: U.svgBars({ labels: ['Ön dik', 'Ön ters', 'Son dik', 'Son ters'], values: [C1.acc, C2.acc, C3.acc, C4.acc].map(x => x * 100), max: 100, colors: ['#16a34a', '#ef4444', '#16a34a', '#ef4444'] }) },
        { title: 'Eğitim blokları – doğruluk (%)', svg: U.svgLine({ series: [{ name: 'Doğruluk', pts: blockAcc.map((a, i) => [i + 1, a * 100]) }], ymin: 0, ymax: 100, xticks: blockAcc.map((_, i) => i + 1), xlabel: 'Blok' }) }],
      interpretation: `<p>Ters çevirme etkisi ön testte <b>${U.ms(ie1)}</b>, eğitimden sonra <b>${U.ms(ie2)}</b> bulundu. Uzmanlıkla bu farkın büyümesi, Greebleların yüzler gibi <i>bütünsel</i> işlenmeye başladığını düşündürür (Gauthier ve ark.). Kısa bir oturumda etki küçük olabilir; blok/deneme sayısını artırarak yeniden deneyin.</p>`,
      trials: rows
    };
  }
});
})();
