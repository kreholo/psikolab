(function () {
'use strict';
const U = Lab.u;
const COLORS = [
  { id: 'red', name: 'KIRMIZI', hex: '#ff4d4d' }, { id: 'blue', name: 'MAVİ', hex: '#4da3ff' }, { id: 'green', name: 'YEŞİL', hex: '#3ddc84' },
  { id: 'yellow', name: 'SARI', hex: '#ffd93d' }, { id: 'purple', name: 'MOR', hex: '#c084fc' }, { id: 'orange', name: 'TURUNCU', hex: '#ff9f43' }];
const NEUTRAL_WORDS = ['MASA', 'KAPI', 'KALEM', 'BULUT', 'SAAT', 'DEFTER', 'KİTAP', 'PENCERE'];

function buildTrials(s, nColors, cond, n) {
  const cols = COLORS.slice(0, nColors), out = [];
  for (let i = 0; i < n; i++) {
    const ink = cols[i % cols.length]; let word;
    if (cond === 'congruent') word = ink.name;
    else if (cond === 'incongruent') { const others = cols.filter(c => c.id !== ink.id); word = others[(i + Math.floor(i / cols.length)) % others.length].name; }
    else word = s.neutral === 'word' ? NEUTRAL_WORDS[i % NEUTRAL_WORDS.length] : 'XXXX';
    out.push({ cond, ink, word });
  }
  return out;
}

Lab.register({
  id: 'stroop', icon: '🎨', short: 'Stroop', title: 'Stroop Testi', group: 'Dikkat / Otomatiklik',
  tagline: 'Kelimenin yazım rengini söyle – anlamı yok say!',
  about: `<p><b>Stroop (1935)</b> etkisi, okuma gibi otomatikleşmiş bir sürecin, daha az otomatik olan renk adlandırma ile çatıştığında yanıtı yavaşlattığını gösterir.
  Örneğin <b style="color:#4da3ff">KIRMIZI</b> kelimesi mavi mürekkeple yazılmışsa doğru yanıt “mavi”dir, ancak kelimeyi okuma eğilimi yanıtı geciktirir ve hata yaptırır.</p>
  <p>Üç koşul vardır: <b>uyumlu</b> (renk = anlam), <b>uyumsuz</b> (renk ≠ anlam) ve <b>nötr</b> (renkle ilgisiz kelime/XXXX). Temel ölçüt <b>Stroop girişimi</b> = uyumsuz RT − uyumlu RT.</p>`,
  howto: `<ol><li>Ekranda renkli bir kelime çıkacak. <b>Kelimenin ne yazdığını değil, hangi renkte yazıldığını</b> seçin.</li>
  <li>Düğmeye dokunun veya klavyede <kbd>1</kbd>–<kbd>6</kbd> tuşlarını kullanın (düğmelerin üzerinde numara yazar).</li><li>Hem hızlı hem doğru olmaya çalışın.</li></ol>`,
  verify: `<ul><li>Genel doğruluk ≥ %85 olmalı (daha düşükse ya acele ettiniz ya da yanlış kuralı uyguladınız).</li><li>150 ms'den kısa tepkiler “tahmin/erken basış” sayılır ve uyarı verilir.</li>
  <li>Her koşulda yeterli doğru deneme aranır; beklenen örüntü: uyumsuz &gt; nötr &gt; uyumlu RT.</li></ul>`,
  refs: 'Stroop, J. R. (1935). Studies of interference in serial verbal reactions. J. Exp. Psychol., 18, 643–662.',
  settings: [
    { group: 'Deneme sayıları' },
    { key: 'nCong', label: 'Uyumlu deneme sayısı', type: 'number', def: 12, min: 1, max: 200 },
    { key: 'nIncong', label: 'Uyumsuz deneme sayısı', type: 'number', def: 12, min: 1, max: 200 },
    { key: 'nNeutral', label: 'Nötr deneme sayısı', type: 'number', def: 12, min: 0, max: 200 },
    { key: 'nPractice', label: 'Alıştırma denemesi', type: 'number', def: 4, min: 0, max: 30 },
    { group: 'Zamanlama' },
    { key: 'fixMs', label: 'Odak (+) süresi', type: 'number', def: 500, min: 0, max: 3000, step: 50, unit: 'ms' },
    { key: 'timeoutMs', label: 'Yanıt süre sınırı', type: 'number', def: 0, min: 0, max: 10000, step: 100, unit: 'ms', help: '0 = sınır yok' },
    { key: 'itiMs', label: 'Denemeler arası boşluk', type: 'number', def: 400, min: 0, max: 3000, step: 50, unit: 'ms' },
    { key: 'feedbackMs', label: 'Geri bildirim süresi', type: 'number', def: 300, min: 0, max: 2000, step: 50, unit: 'ms', help: '0 = ana denemelerde geri bildirim yok' },
    { group: 'Görünüm' },
    { key: 'nColors', label: 'Renk sayısı', type: 'number', def: 4, min: 2, max: 6 },
    { key: 'btnStyle', label: 'Yanıt düğmeleri', type: 'select', def: 'swatch', options: [['swatch', 'Renkli kutular'], ['text', 'Yazılı (renksiz) düğmeler']] },
    { key: 'neutral', label: 'Nötr uyaran', type: 'select', def: 'xxxx', options: [['xxxx', 'Renkli XXXX'], ['word', 'Renk dışı kelime (MASA…)']] }
  ],
  testSettings: { nCong: 3, nIncong: 3, nNeutral: 3, nPractice: 2, fixMs: 30, itiMs: 20, feedbackMs: 0 },
  expectOk: r => r.meta.acc === 1 ? null : 'doğruluk %100 olmalıydı: ' + r.meta.acc,
  unit() {
    const s = { neutral: 'xxxx' }, a = buildTrials(s, 4, 'incongruent', 8), b = buildTrials(s, 4, 'congruent', 8);
    return [['uyumsuz denemelerde kelime ≠ renk', a.every(t => t.word !== t.ink.name)], ['uyumlu denemelerde kelime = renk', b.every(t => t.word === t.ink.name)],
      ['renkler dengeli', new Set(a.map(t => t.ink.id)).size === 4]];
  },
  async run(ctx) {
    const s = ctx.s, cols = COLORS.slice(0, s.nColors);
    ctx.setBg('#161a26', true);
    await ctx.message(`<h3>Stroop Testi</h3><p>Kelimenin <b>yazım rengini</b> seçin, kelimenin anlamını yok sayın.</p><p>Seçenekler: ${cols.map((c, i) => `<b style="color:${c.hex}">${i + 1}</b>`).join(' ')} (renk sırasıyla). Hızlı ve doğru olun.</p>`, 'Başla');
    const options = cols.map((c, i) => s.btnStyle === 'swatch'
      ? { value: c.id, key: String(i + 1), html: `<b style="color:#111">${i + 1}</b>`, style: { background: c.hex, borderColor: c.hex, minWidth: '78px', minHeight: '58px' }, aria: c.name }
      : { value: c.id, key: String(i + 1), html: `${i + 1} · ${c.name[0] + c.name.slice(1).toLowerCase()}` });
    const main = U.shuffle([].concat(buildTrials(s, cols.length, 'congruent', s.nCong), buildTrials(s, cols.length, 'incongruent', s.nIncong), buildTrials(s, cols.length, 'neutral', s.nNeutral)));
    const prac = U.shuffle([].concat(buildTrials(s, cols.length, 'congruent', Math.ceil(s.nPractice / 2)), buildTrials(s, cols.length, 'incongruent', Math.floor(s.nPractice / 2)))).slice(0, s.nPractice);
    const rows = [];
    const total = prac.length + main.length; let k = 0;
    const doTrial = async (t, practice) => {
      ctx.show(`<div class="fix">+</div>`); ctx.setControls(); await ctx.wait(s.fixMs);
      ctx.show(`<div class="big" style="color:${t.ink.hex}">${t.word}</div>`);
      const r = await ctx.waitChoice(options, { timeout: s.timeoutMs || 0, botPick: t.ink.id, layout: 'row' });
      const correct = r.value === t.ink.id;
      rows.push({ blok: practice ? 'alıştırma' : 'ana', koşul: t.cond, kelime: t.word, 'yazım rengi': t.ink.name, yanıt: r.timedOut ? 'süre doldu' : (cols.find(c => c.id === r.value) || {}).name, doğru: correct ? 1 : 0, 'RT (ms)': Math.round(r.rt), erken: r.rt < 150 ? 1 : 0 });
      if (practice || s.feedbackMs > 0) {
        ctx.show(`<div class="mid" style="color:${correct ? '#3ddc84' : '#ff6b6b'}">${r.timedOut ? 'Süre doldu' : correct ? '✔ Doğru' : '✘ Yanlış'}</div>`);
        await ctx.wait(practice ? 500 : s.feedbackMs);
      } else ctx.show('');
      ctx.progress(++k, total);
      await ctx.wait(s.itiMs);
    };
    for (const t of prac) await doTrial(t, true);
    if (prac.length) await ctx.message('<h3>Alıştırma bitti</h3><p>Şimdi asıl test başlıyor.</p>', 'Teste başla');
    for (const t of main) await doTrial(t, false);

    const M = rows.filter(r => r.blok === 'ana'), conds = ['congruent', 'neutral', 'incongruent'], names = { congruent: 'Uyumlu', neutral: 'Nötr', incongruent: 'Uyumsuz' };
    const st = {};
    conds.forEach(c => {
      const rr = M.filter(r => r.koşul === c), ok = rr.filter(r => r.doğru && !r.erken);
      st[c] = { n: rr.length, nOk: ok.length, acc: rr.length ? U.mean(rr.map(r => r.doğru)) : NaN, rt: U.mean(ok.map(r => r['RT (ms)'])), sd: U.sd(ok.map(r => r['RT (ms)'])), sem: U.sem(ok.map(r => r['RT (ms)'])) };
    });
    const acc = M.length ? U.mean(M.map(r => r.doğru)) : 0, early = M.filter(r => r.erken).length, to = M.filter(r => r.yanıt === 'süre doldu').length;
    const interf = st.incongruent.rt - st.congruent.rt, facil = st.neutral.rt - st.congruent.rt;
    const checks = [
      { ok: acc >= 0.85 ? true : acc >= 0.6 ? 'warn' : false, label: `Genel doğruluk: ${U.pct(acc)}`, detail: 'Hedef ≥ %85. Düşükse kuralı (yazım rengi) doğru uyguladığınızdan emin olun.' },
      { ok: early / Math.max(1, M.length) <= 0.1 ? true : 'warn', label: `Erken/tahmin yanıtları (<150 ms): ${early}`, detail: 'Çok fazlaysa deneme sayısı yetersiz kalabilir.' },
      { ok: to / Math.max(1, M.length) <= 0.1 ? true : 'warn', label: `Süre aşımı: ${to}`, detail: 'Süre sınırı kapalıysa 0 olmalı.' },
      { ok: conds.every(c => st[c].n === 0 || st[c].nOk >= 5) ? true : 'warn', label: 'Her koşulda ≥ 5 geçerli (doğru) deneme', detail: conds.map(c => `${names[c]}: ${st[c].nOk}`).join(' · ') },
      { ok: interf > 0 ? true : 'warn', label: `Beklenen Stroop etkisi (uyumsuz > uyumlu): ${isFinite(interf) ? Math.round(interf) + ' ms' : '–'}`, detail: interf > 0 ? 'Beklenen yönde.' : 'Etki ters/yok: az denemeyle olabilir; deneme sayısını artırın.' }
    ];
    return {
      meta: { acc },
      summary: [{ label: 'Doğruluk', value: U.pct(acc) }, { label: 'Uyumlu RT', value: U.ms(st.congruent.rt) }, { label: 'Nötr RT', value: U.ms(st.neutral.rt) }, { label: 'Uyumsuz RT', value: U.ms(st.incongruent.rt) },
        { label: 'Stroop girişimi', value: U.ms(interf), hint: 'uyumsuz − uyumlu' }, { label: 'Kolaylaştırma', value: U.ms(facil), hint: 'nötr − uyumlu' }],
      checks,
      charts: [{ title: 'Ortalama tepki süresi (ms, doğru denemeler)', svg: U.svgBars({ labels: conds.map(c => names[c]), values: conds.map(c => st[c].rt), errors: conds.map(c => st[c].sem), colors: ['#16a34a', '#64748b', '#ef4444'], unit: 'ms' }) },
        { title: 'Doğruluk (%)', svg: U.svgBars({ labels: conds.map(c => names[c]), values: conds.map(c => st[c].acc * 100), max: 100, colors: ['#16a34a', '#64748b', '#ef4444'], unit: '%' }) }],
      interpretation: `<p>Uyumsuz denemelerde ortalama <b>${U.ms(st.incongruent.rt)}</b>, uyumlu denemelerde <b>${U.ms(st.congruent.rt)}</b> yanıt verdiniz; fark (Stroop girişimi) <b>${U.ms(interf)}</b>.
      ${interf > 0 ? 'Bu, kelime okumanın otomatik ve zorunlu biçimde çalıştığını, renk adlandırmayla yarıştığını gösterir.' : 'Etki beklenen yönde çıkmadı; bu genelde az deneme veya dikkat dalgınlığına bağlıdır.'}</p>`,
      trials: rows
    };
  }
});
})();
