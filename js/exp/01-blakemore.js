(function () {
'use strict';
const U = Lab.u;
const ANGLES = [0, 45, 90, 135];                       // 0° = yatay çubuk, 90° = dikey çubuk
const ANGLE_NAMES = { 0: 'Yatay (0°)', 45: 'Çapraz (45°)', 90: 'Dikey (90°)', 135: 'Çapraz (135°)' };
const GROUPS = { vertical: 'Dikey çizgilerde büyüyen', horizontal: 'Yatay çizgilerde büyüyen', normal: 'Normal ortamda büyüyen (kontrol)', dark: 'Karanlıkta büyüyen' };

const tuning = d => { d = Math.abs(d) % 180; d = Math.min(d, 180 - d); return Math.exp(-d * d / (2 * 22 * 22)); };
function exposure(env) {
  const p = new Array(36).fill(0);
  if (env === 'normal') p.fill(1 / 36);
  else if (env === 'vertical' || env === 'horizontal') {
    const c = env === 'vertical' ? 90 : 0; let sum = 0;
    for (let i = 0; i < 36; i++) { let d = Math.abs(i * 5 - c); d = Math.min(d, 180 - d); if (d <= 10) { p[i] = 1; sum++; } }
    for (let i = 0; i < 36; i++) p[i] /= sum;
  }
  return p;
}
const drive = (thetas, env) => { const p = exposure(env); return thetas.map(th => p.reduce((s, pi, k) => s + pi * tuning(k * 5 - th), 0)); };
const cp = wk => wk < 3 ? 0.2 : wk <= 12 ? 1 : wk <= 24 ? 0.25 : 0.03;      // kritik dönem eğrisi
function rear(thetas, env, startWk, weeks, hours) {
  const w = thetas.map(() => 1), A = drive(thetas, env), cRef = drive(thetas, 'normal')[0];
  const target = A.map(a => env === 'dark' ? 0.45 : U.clamp(a / cRef, 0, 1)), hf = Math.min(1, hours / 5);
  for (let wk = startWk; wk < startWk + weeks; wk += 0.25) for (let i = 0; i < w.length; i++) w[i] += cp(wk) * 0.5 * hf * (target[i] - w[i]) * 0.25;
  return w;
}
const popResp = (thetas, w, ang) => { let a = 0, b = 0; thetas.forEach((th, i) => { const g = tuning(ang - th); a += w[i] * g; b += g; }); return b ? a / b : 0; };

function drawScene(g, W, H, env, wk, total, label) {
  g.fillStyle = env === 'dark' ? '#05060a' : '#e9edf7'; g.fillRect(0, 0, W, H);
  if (env === 'vertical' || env === 'horizontal') {
    g.fillStyle = '#111';
    for (let i = 0; i < 40; i++) { if (env === 'vertical') g.fillRect(i * 18, 0, 8, H); else g.fillRect(0, i * 18, W, 8); }
  } else if (env === 'normal') {
    const r = U.rng(7); for (let i = 0; i < 26; i++) { g.fillStyle = `hsl(${r() * 360},65%,60%)`; g.save(); g.translate(r() * W, r() * H); g.rotate(r() * 3); g.fillRect(-20, -6, 40 + r() * 40, 12); g.restore(); }
  }
  g.font = '64px serif'; g.textAlign = 'center'; g.fillText('🐈', W / 2 + Math.sin(wk * 3) * 120, H / 2 + 20);
  g.fillStyle = env === 'dark' ? '#fff' : '#111'; g.font = 'bold 18px system-ui'; g.fillText(label, W / 2, 28);
  g.font = '15px system-ui'; g.fillText(`Hafta ${Math.round(wk)} · günde 5 saat maruziyet`, W / 2, H - 14);
}
function drawTrial(g, W, H, ang, responded, k, n, name) {
  g.fillStyle = '#eef1f9'; g.fillRect(0, 0, W, H);
  g.save(); g.translate(W * 0.68, H / 2); g.rotate((90 - ang) * Math.PI / 180); g.strokeStyle = '#222'; g.lineWidth = 12; g.lineCap = 'round';
  g.beginPath(); g.moveTo(0, -100); g.lineTo(0, 100); g.stroke(); g.restore();
  g.font = '64px serif'; g.textAlign = 'center'; g.fillText('🐈', responded ? W * 0.42 : W * 0.2, H / 2 + 20);
  g.font = 'bold 16px system-ui'; g.fillStyle = '#111'; g.fillText(`${name} · çubuk: ${ANGLE_NAMES[ang]} · deneme ${k}/${n}`, W / 2, 26);
  g.fillStyle = responded ? '#16a34a' : '#b45309'; g.font = 'bold 18px system-ui'; g.fillText(responded ? '→ Çubuğa yaklaştı / dokundu' : 'İlgisiz kaldı', W / 2, H - 16);
}

Lab.register({
  id: 'blakemore', icon: '🐈', short: 'Blakemore & Cooper', title: 'Blakemore & Cooper (1970) – Çizgili ortamda yetişen yavru kediler', group: 'Algı / Deneyim',
  tagline: 'Görsel deneyim, beynin yönelim seçici hücrelerini şekillendirir (kritik dönem).',
  about: `<p><b>Blakemore ve Cooper (1970)</b> yavru kedileri ilk haftalarından itibaren günde birkaç saat <b>yalnızca dikey</b> ya da <b>yalnızca yatay</b> çizgili silindirlerde, geri kalan zamanı karanlıkta büyüttü.
  Sonuç: dikey ortamda büyüyenler yatay çubuklara, yatay ortamda büyüyenler dikey çubuklara neredeyse hiç tepki vermedi; görme korteksinde de deneyimlenmeyen yöne ayarlı hücre bulunmadı.</p>
  <p>İnsanlarda bu deneyi yapmak etik değildir; bu sekme <b>hesaplamalı bir benzetimdir</b> (kullanıma bağlı plastisite + kritik dönem modeli). Siz “deneyci” olarak yetiştirme koşullarını ayarlar, davranış testi ve hücre kaydı sonuçlarını incelersiniz.</p>`,
  howto: `<ol><li>Önce sonucu <b>tahmin edin</b> (kısa soru).</li><li>Ayarlardan grup, başlangıç haftası, yetiştirme süresi ve günlük maruziyeti seçin.</li>
  <li>Benzetim önce yetiştirmeyi gösterir, sonra çubukla <b>davranış testi</b> ve <b>hücre kaydı</b> yapar.</li><li>Sonuçlarda grafikleri ve kontrol listesini inceleyin.</li></ol>`,
  verify: `<ul><li>Tahmininiz doğru muydu? (dikey grup → yatay çubuğa az tepki)</li><li>Yetiştirme kritik dönemde (≈3–12. hafta) başladı mı? Yetişkin kedide etki beklenmez.</li>
  <li>Her yönelim için yeterli test denemesi var mı ve kontrol grubunda yönelim farkı yok mu?</li></ul>`,
  refs: 'Blakemore, C., & Cooper, G. F. (1970). Development of the brain depends on the visual environment. Nature, 228, 477–478.',
  settings: [
    { group: 'Yetiştirme (bağımsız değişken)' },
    { key: 'group', label: 'Grup', type: 'select', def: 'all3', options: [['all3', 'Dikey + Yatay + Kontrol (hepsi)'], ['vertical', 'Yalnız dikey'], ['horizontal', 'Yalnız yatay'], ['normal', 'Yalnız normal'], ['dark', 'Yalnız karanlık']] },
    { key: 'startWeek', label: 'Maruziyet başlangıç yaşı', type: 'number', def: 3, min: 0, max: 40, unit: 'hafta', help: 'Kritik dönem ≈ 3–12. hafta' },
    { key: 'weeks', label: 'Yetiştirme süresi', type: 'number', def: 10, min: 1, max: 40, unit: 'hafta' },
    { key: 'hours', label: 'Günlük maruziyet', type: 'number', def: 5, min: 0.5, max: 24, step: 0.5, unit: 'saat' },
    { group: 'Ölçüm' },
    { key: 'reps', label: 'Her yönelim için test sayısı', type: 'number', def: 8, min: 2, max: 40 },
    { key: 'cells', label: 'Kaydedilen nöron sayısı', type: 'number', def: 60, min: 12, max: 240, step: 6 },
    { key: 'noise', label: 'Ölçüm gürültüsü', type: 'number', def: 0.08, min: 0, max: 0.5, step: 0.02 },
    { group: 'Zaman' },
    { key: 'rearSec', label: 'Yetiştirme animasyonu süresi', type: 'number', def: 3, min: 1, max: 20, unit: 'sn' },
    { key: 'trialMs', label: 'Test denemesi süresi', type: 'number', def: 350, min: 50, max: 2000, step: 50, unit: 'ms' }
  ],
  testSettings: { rearSec: 0.3, trialMs: 15, reps: 3 },
  unit() {
    const th = U.range(36).map(i => i * 5), v = rear(th, 'vertical', 3, 10, 5), n = rear(th, 'normal', 3, 10, 5), ad = rear(th, 'vertical', 40, 10, 5);
    return [['dikey grup: dikey > yatay tepki', popResp(th, v, 90) - popResp(th, v, 0) > 0.4], ['kontrol: yönelim farkı yok', Math.abs(popResp(th, n, 90) - popResp(th, n, 0)) < 0.05],
      ['yetişkinde etki zayıf', popResp(th, ad, 0) > 0.8]];
  },
  async run(ctx) {
    const s = ctx.s;
    const pred = await ctx.form(`<fieldset><legend>Tahmin: Yalnızca <b>dikey</b> çizgili ortamda büyüyen kedi, hangi yönelimdeki çubuğa <u>en az</u> tepki verir?</legend>
      <label class="opt"><input type="radio" name="p" value="h"> Yatay çubuk</label><label class="opt"><input type="radio" name="p" value="v"> Dikey çubuk</label>
      <label class="opt"><input type="radio" name="p" value="n"> Hiçbiri – fark olmaz</label></fieldset>`, { submit: 'Tahminimi kaydet', validate: d => d.p ? null : 'Lütfen bir seçenek işaretleyin.' });
    const groups = s.group === 'all3' ? ['vertical', 'horizontal', 'normal'] : [s.group];
    const res = {};
    for (const grp of groups) {
      const thetas = U.range(s.cells).map(i => (i + 0.5) * 180 / s.cells + U.rand(-2, 2));
      const w = rear(thetas, grp, s.startWeek, s.weeks, s.hours);
      await ctx.message(`<h3>${GROUPS[grp]}</h3><p>Yavru kediler ${s.startWeek}. haftadan başlayarak ${s.weeks} hafta, günde ${s.hours} saat bu ortamda tutulacak.</p>`, '▶ Yetiştirmeyi başlat');
      const C2 = ctx.canvas(640, 340), g2 = C2.g;
      await ctx.animate(t => { const f = Math.min(1, t / s.rearSec); drawScene(g2, 640, 340, grp, s.startWeek + f * s.weeks, s.weeks, GROUPS[grp]); return f >= 1; });
      ctx.hud(`<b>${GROUPS[grp]}</b> – davranış testi: çubuk sunuluyor…`);
      const trials = [], order = U.shuffle([].concat(...ANGLES.map(a => U.range(s.reps).map(() => a))));
      let k = 0;
      for (const ang of order) {
        const R = popResp(thetas, w, ang), p = U.clamp(0.06 + 0.9 * Math.pow(R, 1.3) + U.rand(-s.noise, s.noise), 0.02, 0.98), responded = Math.random() < p;
        trials.push({ grup: GROUPS[grp], 'çubuk açısı': ang, tepki: responded ? 1 : 0 });
        drawTrial(g2, 640, 340, ang, responded, ++k, order.length, GROUPS[grp].split(' ')[0]); await ctx.wait(s.trialMs);
      }
      const byAng = {}; ANGLES.forEach(a => { const rr = trials.filter(x => x['çubuk açısı'] === a); byAng[a] = U.mean(rr.map(x => x.tepki)); });
      // hücre kaydı
      const cell = thetas.map((th, i) => ({ th, r: U.clamp(w[i] + U.rand(-s.noise, s.noise), 0, 1) }));
      const bins = U.range(6).map(() => 0); cell.forEach(c => { if (c.r > 0.3) bins[Math.round(c.th / 30) % 6]++; });
      res[grp] = { byAng, trials, bins, resp: cell.filter(c => c.r > 0.3).length };
    }
    const G = Object.keys(res), last = G[G.length - 1];
    const diff = grp => res[grp].byAng[90] - res[grp].byAng[0];
    const checks = [{ ok: pred.p === 'h' ? true : 'warn', label: `Tahmin: ${pred.p === 'h' ? 'doğru (yatay çubuğa az tepki)' : 'beklenenden farklı'}`, detail: 'Dikey ortamda büyüyen kediler yatay çubuğa en az tepki verir (Blakemore & Cooper, 1970).' },
      { ok: (s.startWeek >= 2 && s.startWeek <= 14) ? true : 'warn', label: `Maruziyet kritik dönemde mi? (başlangıç ${s.startWeek}. hafta)`, detail: 'Kritik dönem ≈ 3–12. hafta; dışındaki yetiştirme çok az etki yapar.' },
      { ok: s.reps >= 6 ? true : 'warn', label: `Yönelim başına ${s.reps} test denemesi`, detail: 'Güvenilir oran tahmini için ≥ 6 önerilir.' }];
    G.forEach(grp => {
      const d = diff(grp);
      if (grp === 'vertical') checks.push({ ok: d > 0.25 ? true : 'warn', label: `Dikey grup: dikey − yatay tepki = ${U.fmt(d * 100)} puan`, detail: 'Beklenen: belirgin pozitif fark.' });
      else if (grp === 'horizontal') checks.push({ ok: d < -0.25 ? true : 'warn', label: `Yatay grup: dikey − yatay tepki = ${U.fmt(d * 100)} puan`, detail: 'Beklenen: belirgin negatif fark.' });
      else if (grp === 'normal') checks.push({ ok: Math.abs(d) < 0.25 ? true : 'warn', label: `Kontrol: dikey − yatay tepki = ${U.fmt(d * 100)} puan`, detail: 'Beklenen: yönelim farkı yok.' });
    });
    const charts = [{ title: 'Davranış: çubuğa tepki oranı (%)', svg: U.svgLine({ series: G.map((grp, i) => ({ name: GROUPS[grp].split(' ')[0], color: U.PALETTE[i], pts: ANGLES.map(a => [a, res[grp].byAng[a] * 100]) })), xticks: ANGLES, ymin: 0, ymax: 100, xlabel: 'Çubuk açısı (0° yatay, 90° dikey)', ylabel: '% tepki' }) }];
    G.forEach(grp => charts.push({ title: `Kortikal hücrelerin tercih ettiği yönelim – ${GROUPS[grp].split(' ')[0]} (${res[grp].resp} yanıtlı hücre)`, svg: U.svgBars({ labels: ['Yatay 0°', '30°', '60°', 'Dikey 90°', '120°', '150°'].map((x, i) => x), values: [0, 1, 2, 3, 4, 5].map(i => res[grp].bins[i]), unit: 'hücre', colors: ['#f59e0b', '#94a3b8', '#94a3b8', '#4f46e5', '#94a3b8', '#94a3b8'], dec: 0 }) }));
    return {
      summary: G.map(grp => ({ label: GROUPS[grp].split(' ')[0] + ' – dikey/yatay tepki', value: `${U.pct(res[grp].byAng[90])} / ${U.pct(res[grp].byAng[0])}` })).concat([{ label: 'Tahmin', value: pred.p === 'h' ? 'Doğru' : 'Yanlış' }]),
      checks, charts,
      interpretation: `<p>Yetiştirme sırasında görülmeyen yönelime ayarlı nöronların tepkisi zayıfladı; bu hücreler azaldığı için kedi deneyimlemediği yönelimdeki çubuğa tepki vermedi. Kontrol grubunda böyle bir ayrım yok.
      Aynı ortam yetişkin kediye uygulandığında (başlangıç haftasını 30’un üzerine çıkarın) etkinin kaybolduğunu görebilirsiniz – <b>kritik dönem</b> etkisi.</p>`,
      trials: [].concat(...G.map(grp => res[grp].trials))
    };
  }
});
})();
