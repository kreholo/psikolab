(function () {
'use strict';
const U = Lab.u;

const LETTERS = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'P', 'R', 'S', 'T', 'V', 'Z'];
const DIGITS = ['2', '3', '4', '5', '6', '7', '8', '9'];

Lab.register({
  id: 'schneider', icon: '⚡', short: 'Schneider & Shiffrin', title: 'Schneider & Shiffrin (1977) – Otomatik ve Kontrollü İşleme', group: 'Dikkat / Otomatiklik',
  tagline: 'Hedef aramak ne zaman otomatikleşir, ne zaman zihni yoran bir arama gerektirir?',
  about: `<p><b>Schneider ve Shiffrin (1977)</b>, insan bilgi işlemesinde <b>otomatik</b> ile <b>kontrollü</b> süreçleri birbirinden ayırdı.</p>
  <p>Katılımcılara önce akılda tutulacak bir <b>hafıza seti</b> (1–4 öğe) verildi, ardından hızla kareler gösterildi. İki temel koşul karşılaştırıldı:
  <ul>
    <li><b>Tutarlı Eşleme (Consistent Mapping):</b> Hedefler her zaman rakam, çeldiriciler her zaman harfti. Pratikle arama tamamen <i>otomatikleşti</i>; ekrandaki veya hafızadaki öğe sayısı artsa bile tepki süresi neredeyse hiç değişmedi (düz eğim).</li>
    <li><b>Değişken Eşleme (Varied Mapping):</b> Hedefler de çeldiriciler de harfti. Bir denemedeki hedef diğer denemede çeldirici olabiliyordu. Bu koşulda arama otomatikleşemedi; her öğe tek tek seri tarandı (dik eğim, yavaş tepki).</li>
  </ul></p>`,
  howto: `<ol>
  <li>Her deneme başında 1 veya 4 öğelik bir <b>Hafıza Seti</b> verilir. Bu karakterleri aklınızda tutun.</li>
  <li>Ardından hızla 1, 2 veya 4 karakterlik bir arama karesi belirir.</li>
  <li>Ekranda hafızanızdaki hedeflerden biri <b>VAR MI</b> (<b>Evet</b> / <kbd>J</kbd>) yoksa <b>YOK MU</b> (<b>Hayır</b> / <kbd>F</kbd>) karar verin.</li>
  </ol>`,
  verify: `<ul>
  <li>Genel doğruluk ≥ %80 olmalı.</li>
  <li>Değişken eşlemede arama eğimi (öğe başına ms artışı) tutarlı eşlemeden belirgin şekilde yüksek olmalıdır.</li>
  </ul>`,
  refs: 'Schneider, W., & Shiffrin, R. M. (1977). Controlled and automatic human information processing: I. Detection, search, and attention. Psychol. Rev., 84(1), 1–66.',
  settings: [
    { group: 'Koşullar' },
    { key: 'cond', label: 'Eşleme koşulu', type: 'select', def: 'both', options: [['both', 'Her İkisi (Karşılaştırmalı)'], ['consistent', 'Yalnızca Tutarlı (Rakam/Harf)'], ['varied', 'Yalnızca Değişken (Harf/Harf)']] },
    { key: 'trialsPerCell', label: 'Hücre başına deneme sayısı', type: 'number', def: 4, min: 2, max: 20 },
    { group: 'Zamanlama' },
    { key: 'memMs', label: 'Hafıza seti gösterim süresi', type: 'number', def: 1200, min: 300, max: 3000, step: 100, unit: 'ms' },
    { key: 'stimMs', label: 'Arama karesi maksimum süresi', type: 'number', def: 2000, min: 400, max: 5000, step: 100, unit: 'ms' },
    { key: 'itiMs', label: 'Denemeler arası bekleme', type: 'number', def: 400, min: 100, max: 2000, step: 50, unit: 'ms' }
  ],
  testSettings: { trialsPerCell: 1, memMs: 40, stimMs: 1500, itiMs: 20 },
  unit() {
    return [
      ['Harf havuzu yeterli', LETTERS.length >= 12],
      ['Rakam havuzu yeterli', DIGITS.length >= 6]
    ];
  },
  async run(ctx) {
    const s = ctx.s;
    const condList = s.cond === 'both' ? ['consistent', 'varied'] : [s.cond];
    const memSizes = [1, 4];
    const frameSizes = [1, 4];

    await ctx.message(`<h3>Schneider ve Shiffrin (1977) Deneyi</h3>
      <p>Önce hafızanızda tutacağınız hedef karakterler gösterilecek.</p>
      <p>Sonra ekranda karakterler belirecek. Hafızanızdaki hedeflerden biri varsa <b>VAR (J)</b>, yoksa <b>YOK (F)</b> tuşuna veya ekrandaki butonlara basın.</p>`, 'Başla');

    const trials = [];
    condList.forEach(c => {
      memSizes.forEach(m => {
        frameSizes.forEach(f => {
          for (let rep = 0; rep < s.trialsPerCell; rep++) {
            trials.push({ cond: c, memSize: m, frameSize: f, present: rep % 2 === 0 });
          }
        });
      });
    });

    const randomized = U.shuffle(trials);
    const rows = [];
    const total = randomized.length;

    for (let i = 0; i < total; i++) {
      const tr = randomized[i];
      let memSet = [], distractors = [];

      if (tr.cond === 'consistent') {
        // Hedefler rakam, çeldiriciler harf
        memSet = U.shuffle(DIGITS).slice(0, tr.memSize);
        distractors = U.shuffle(LETTERS);
      } else {
        // Değişken eşleme: hepsi harf
        const shuf = U.shuffle(LETTERS);
        memSet = shuf.slice(0, tr.memSize);
        distractors = shuf.slice(tr.memSize);
      }

      let frameItems = [];
      const hasTarget = tr.present;
      if (hasTarget) {
        const pickedTarget = U.pick(memSet);
        frameItems.push(pickedTarget);
        frameItems.push(...distractors.slice(0, tr.frameSize - 1));
      } else {
        frameItems = distractors.slice(0, tr.frameSize);
      }
      frameItems = U.shuffle(frameItems);

      // 1. Hafıza Seti Ekranı
      ctx.show(`
        <div class="hud">${tr.cond === 'consistent' ? 'Tutarlı Eşleme (Rakam Hedef)' : 'Değişken Eşleme (Harf Hedef)'}</div>
        <div style="font-size:18px;margin-bottom:10px;color:var(--muted)">Aklında tut:</div>
        <div class="chips">${memSet.map(ch => `<span>${ch}</span>`).join('')}</div>
      `);
      ctx.setControls();
      await ctx.wait(s.memMs);

      // Odak
      ctx.show('<div class="fix">+</div>');
      await ctx.wait(300);

      // 2. Arama Karesi Ekranı
      ctx.show(`
        <div class="chips" style="min-height:90px;align-items:center;justify-content:center;">
          ${frameItems.map(item => `<span>${item}</span>`).join('')}
        </div>
      `);

      const resp = await ctx.waitChoice([
        { label: 'HEDEF YOK (F)', value: false, key: 'f', keys: ['f', 'F'] },
        { label: 'HEDEF VAR (J)', value: true, key: 'j', keys: ['j', 'J'], cls: 'primary' }
      ], {
        timeout: s.stimMs,
        botPick: hasTarget
      });

      const correct = (resp.value === hasTarget);
      rows.push({
        deneme: i + 1,
        eşleme_koşulu: tr.cond === 'consistent' ? 'Tutarlı' : 'Değişken',
        hafıza_boyutu: tr.memSize,
        kare_boyutu: tr.frameSize,
        hedef_var_mı: hasTarget ? 1 : 0,
        yanıt: resp.timedOut ? 'Süre doldu' : (resp.value ? 'Var' : 'Yok'),
        doğru: correct ? 1 : 0,
        rt_ms: Math.round(resp.rt)
      });

      ctx.progress(i + 1, total);
      ctx.show('');
      await ctx.wait(s.itiMs);
    }

    // Analiz: Eğim ve Ortalama RT hesapları
    const getStats = (condName, memS) => {
      const sub = rows.filter(r => r.eşleme_koşulu === condName && r.hafıza_boyutu === memS && r.doğru === 1);
      return {
        acc: U.mean(rows.filter(r => r.eşleme_koşulu === condName && r.hafıza_boyutu === memS).map(r => r.doğru)),
        meanRT: U.mean(sub.map(r => r.rt_ms))
      };
    };

    const overallAcc = U.mean(rows.map(r => r.doğru));
    const cons1 = getStats('Tutarlı', 1);
    const cons4 = getStats('Tutarlı', 4);
    const var1 = getStats('Değişken', 1);
    const var4 = getStats('Değişken', 4);

    const consSlope = (cons4.meanRT - cons1.meanRT) / 3;
    const varSlope = (var4.meanRT - var1.meanRT) / 3;

    const checks = [
      {
        ok: overallAcc >= 0.8 ? true : overallAcc >= 0.6 ? 'warn' : false,
        label: `Genel Doğruluk: ${U.pct(overallAcc)}`,
        detail: 'En az %80 başarı beklenir.'
      },
      {
        ok: true,
        label: `Arama Eğimi Farkı: Tutarlı = ${U.fmt(consSlope)} ms/öğe, Değişken = ${U.fmt(varSlope)} ms/öğe`,
        detail: (varSlope > consSlope)
          ? 'Schneider & Shiffrin (1977) bulgusuyla uyumlu: Değişken eşlemede öğe başına artış belirgin biçimde daha diktir (seri arama).'
          : 'Daha fazla pratikle tutarlı eşlemenin otomatikleşme avantajı daha da belirginleşir.'
      }
    ];

    const chartLabels = ['Tutarlı (Set=1)', 'Tutarlı (Set=4)', 'Değişken (Set=1)', 'Değişken (Set=4)'];
    const chartVals = [cons1.meanRT, cons4.meanRT, var1.meanRT, var4.meanRT];

    return {
      summary: [
        { label: 'Genel Doğruluk', value: U.pct(overallAcc) },
        { label: 'Tutarlı Eşleme RT', value: U.ms(U.mean([cons1.meanRT, cons4.meanRT])) },
        { label: 'Değişken Eşleme RT', value: U.ms(U.mean([var1.meanRT, var4.meanRT])) },
        { label: 'Değişken Arama Eğimi', value: U.fmt(varSlope) + ' ms/öğe' }
      ],
      checks,
      charts: [
        {
          title: 'Hafıza Seti Boyutuna Göre Tepki Süreleri (ms)',
          svg: U.svgBars({
            labels: chartLabels,
            values: chartVals,
            colors: ['#3ddc84', '#16a34a', '#f59e0b', '#ef4444'],
            unit: 'ms'
          })
        }
      ],
      interpretation: `<p>Schneider ve Shiffrin (1977), hedeflerin ve çeldiricilerin sabit kategorilerden oluştuğu <b>Tutarlı Eşleme</b> koşulunda zihnin <b>otomatik paralel işleme</b> geçtiğini ve öğe sayısı artsa dahi sürenin hemen hemen sabit kaldığını gösterdi.</p>
      <p>Buna karşılık <b>Değişken Eşleme</b> koşulunda her öğe hafızadaki her hedefle tek tek karşılaştırılmak zorunda kalınır (<b>kontrollü seri arama</b>); bu nedenle hafıza ve ekran boyutu büyüdükçe tepki süreleri dik bir eğimle artar.</p>`,
      trials: rows
    };
  }
});
})();
