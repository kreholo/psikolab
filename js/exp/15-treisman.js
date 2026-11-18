(function () {
'use strict';
const U = Lab.u;

const SHAPES = [
  { id: 'triangle', name: 'Üçgen' },
  { id: 'circle', name: 'Daire' },
  { id: 'square', name: 'Kare' },
  { id: 'cross', name: 'Artı' }
];

const COLORS = [
  { id: 'red', name: 'Kırmızı', hex: '#ef4444' },
  { id: 'green', name: 'Yeşil', hex: '#22c55e' },
  { id: 'blue', name: 'Mavi', hex: '#3b82f6' },
  { id: 'yellow', name: 'Sarı', hex: '#eab308' }
];

function drawItem(g, shapeId, colorHex, cx, cy, size) {
  g.fillStyle = colorHex;
  g.strokeStyle = colorHex;
  g.lineWidth = 4;
  g.beginPath();

  if (shapeId === 'circle') {
    g.arc(cx, cy, size / 2, 0, Math.PI * 2);
    g.fill();
  } else if (shapeId === 'square') {
    g.fillRect(cx - size / 2, cy - size / 2, size, size);
  } else if (shapeId === 'triangle') {
    g.moveTo(cx, cy - size / 2);
    g.lineTo(cx + size / 2, cy + size / 2);
    g.lineTo(cx - size / 2, cy + size / 2);
    g.closePath();
    g.fill();
  } else if (shapeId === 'cross') {
    const w = size / 3;
    g.fillRect(cx - w / 2, cy - size / 2, w, size);
    g.fillRect(cx - size / 2, cy - w / 2, size, w);
  }
}

Lab.register({
  id: 'treisman', icon: '🔺', short: 'Treisman Bağlaç', title: 'Treisman & Schmidt (1982) – Yanılsamalı Bağlaçlar (Illusory Conjunctions)', group: 'Özellik Bütünleştirme / Dikkat',
  tagline: 'Dikkat dağıldığında renkler ve şekiller birbirine karışır mı?',
  about: `<p><b>Anne Treisman ve Hilary Schmidt (1982)</b>, bilişsel psikolojinin kilometre taşlarından biri olan <b>Özellik Bütünleştirme Kuramını (Feature Integration Theory - FIT)</b> test etti.</p>
  <p>Kurama göre görsel özellikler (renk, şekil, boyut) beynin farklı bölgelerinde <b>dikkat öncesi (preattentive)</b> aşamada birbirinden bağımsız ve serbest olarak analiz edilir. Bu parçaları birbirine "yapıştırıp" birleşik bir nesne oluşturan şey <b>odaklanmış dikkattir</b>.</p>
  <p>Katılımcılara iki siyah rakam (örn. 3 ve 7) ve aralarında renkli şekiller çok kısa süre (200 ms) gösterildi. Öncelikli görev <b>iki rakamı</b> söylemek olduğundan dikkat şekillerden çekildi. Sonuçta katılımcılar sıklıkla <b>Yanılsamalı Bağlaçlar</b> bildirdiler: Örneğin ekranda <i>Kırmızı Üçgen</i> ve <i>Yeşil Daire</i> varken, kişi büyük bir kesinlikle <b>“Yeşil Üçgen”</b> gördüğünü söyledi!</p>`,
  howto: `<ol>
  <li>Ekranda çok kısa süreyle iki uçta <b>siyah sayılar</b> ve ortada <b>renkli şekiller</b> yanıp sönecektir.</li>
  <li><u>1. Öncelikli Göreviniz:</u> İki uçtaki <b>siyah sayıları</b> doğru hatırlamak!</li>
  <li><u>2. Göreviniz:</u> Ortadaki şekillerden birinin şeklini ve rengini rapor etmek.</li>
  <li>Dikkat sayılara odaklandığı için renkler ve şekiller zihninizde yer değiştirebilir!</li>
  </ol>`,
  verify: `<ul>
  <li>Sayıların doğruluğu (birincil görevin dikkati bağlayıp bağlamadığı) kontrol edilir.</li>
  <li>Yanılsamalı bağlaç (özellikler doğru ama yanlış eşleşmiş: örn. yeşil üçgen) oranı hesaplanır.</li>
  <li>Tamamen yanlış (ekranda hiç olmayan renk veya şekil) hata oranları ile ayrıştırılır.</li>
  </ul>`,
  refs: 'Treisman, A., & Schmidt, H. (1982). Illusory conjunctions in the perception of objects. Cognit. Psychol., 14(1), 107–141.',
  settings: [
    { group: 'Zamanlama' },
    { key: 'flashMs', label: 'Uyaran flaş süresi', type: 'number', def: 200, min: 80, max: 1000, step: 20, unit: 'ms' },
    { key: 'maskMs', label: 'Görsel maske süresi', type: 'number', def: 250, min: 50, max: 800, step: 50, unit: 'ms' },
    { group: 'Deneme Yapısı' },
    { key: 'trials', label: 'Deneme sayısı', type: 'number', def: 8, min: 4, max: 30 }
  ],
  testSettings: { flashMs: 30, maskMs: 20, trials: 4 },
  unit() {
    return [
      ['Şekil tanımları tam', SHAPES.length >= 4],
      ['Renk tanımları tam', COLORS.length >= 4]
    ];
  },
  async run(ctx) {
    const s = ctx.s;
    const W = 520, H = 300;
    const C = ctx.canvas(W, H, { maxWidth: 540 });
    const g = C.g;

    await ctx.message(`<h3>Treisman & Schmidt (1982) – Yanılsamalı Bağlaçlar</h3>
      <p>⚠️ <b>ASIL GÖREV:</b> Ekranın solunda ve sağında belirecek <b>İKİ SİYAH SAYIYI</b> aklınızda tutun.</p>
      <p>Sayıların arasında renkli şekiller hızla yanıp sönecektir. Flaş bittikten sonra hem sayıları hem de gördüğünüz şekillerden birini soracağız.</p>`, 'Başla');

    const trialsData = [];
    const n = s.trials;

    for (let t = 0; t < n; t++) {
      ctx.hud(`Deneme ${t + 1} / ${n}`);

      // İki siyah sayı
      const numLeft = U.int(2, 9);
      let numRight = U.int(2, 9);
      while (numRight === numLeft) numRight = U.int(2, 9);

      // Ortadaki 3 renkli şekil (özellikleri eşsiz)
      const shufShapes = U.shuffle(SHAPES).slice(0, 3);
      const shufColors = U.shuffle(COLORS).slice(0, 3);

      const items = [
        { shape: shufShapes[0], color: shufColors[0], x: W * 0.35, y: H / 2 },
        { shape: shufShapes[1], color: shufColors[1], x: W * 0.50, y: H / 2 },
        { shape: shufShapes[2], color: shufColors[2], x: W * 0.65, y: H / 2 }
      ];

      // Odak
      g.fillStyle = '#f1f3fa'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#1e293b'; g.font = '36px system-ui'; g.textAlign = 'center';
      g.fillText('+', W / 2, H / 2 + 12);
      ctx.setControls();
      await ctx.wait(600);

      // FLAŞ EKRANI
      g.fillStyle = '#f1f3fa'; g.fillRect(0, 0, W, H);
      // Sayılar
      g.fillStyle = '#0f172a';
      g.font = 'bold 56px system-ui';
      g.textAlign = 'center';
      g.fillText(String(numLeft), 70, H / 2 + 18);
      g.fillText(String(numRight), W - 70, H / 2 + 18);

      // Renkli şekiller
      items.forEach(it => {
        drawItem(g, it.shape.id, it.color.hex, it.x, it.y, 42);
      });

      await ctx.wait(s.flashMs);

      // MASKE
      g.fillStyle = '#cbd5e1'; g.fillRect(0, 0, W, H);
      const r = U.rng(t * 100);
      for (let m = 0; m < 60; m++) {
        g.fillStyle = `rgba(${U.int(0,255)},${U.int(0,255)},${U.int(0,255)},0.6)`;
        g.fillRect(r() * W, r() * H, 20 + r() * 30, 20 + r() * 30);
      }
      await ctx.wait(s.maskMs);
      g.fillStyle = '#f1f3fa'; g.fillRect(0, 0, W, H);

      // 1. Rapor: İki siyah sayı
      const numForm = await ctx.form(`
        <fieldset>
          <legend>1. Adım: İki uçta gördüğünüz <b>siyah sayıları</b> yazın:</legend>
          <div style="display:flex;gap:12px;margin-top:6px">
            <input type="number" name="n1" placeholder="Sol sayı" required min="1" max="9" style="font-size:20px;text-align:center">
            <input type="number" name="n2" placeholder="Sağ sayı" required min="1" max="9" style="font-size:20px;text-align:center">
          </div>
        </fieldset>
      `, {
        submit: 'Sayıları Onayla',
        validate: d => (d.n1 && d.n2) ? null : 'Lütfen iki sayıyı da girin.'
      });

      const userN1 = parseInt(numForm.n1, 10);
      const userN2 = parseInt(numForm.n2, 10);
      const numsCorrect = (userN1 === numLeft && userN2 === numRight) || (userN1 === numRight && userN2 === numLeft);

      // 2. Rapor: Şekil ve Renk seçimi
      // Hedef olarak ortadaki şekillerden biri sorulur
      const targetItem = items[1]; // Ortadaki nesne

      const shapeForm = await ctx.form(`
        <fieldset>
          <legend>2. Adım: Ortadaki renkli şekillerden birini seçin:</legend>
          <p style="color:var(--muted);font-size:14px">Aşağıdaki renk ve şekillerden hangisini gördüğünüzden eminsiniz?</p>
          <div style="margin-bottom:10px">
            <b>Şekil:</b>
            <div class="chips">
              ${SHAPES.map(sh => `
                <label>
                  <input type="radio" name="repShape" value="${sh.id}">
                  <span>${sh.name}</span>
                </label>
              `).join('')}
            </div>
          </div>
          <div>
            <b>Renk:</b>
            <div class="chips">
              ${COLORS.map(c => `
                <label>
                  <input type="radio" name="repColor" value="${c.id}">
                  <span style="color:${c.hex};font-weight:700">${c.name}</span>
                </label>
              `).join('')}
            </div>
          </div>
        </fieldset>
      `, {
        submit: 'Cevabı Kaydet',
        validate: d => (d.repShape && d.repColor) ? null : 'Lütfen hem bir şekil hem de bir renk işaretleyin.'
      });

      const chosenShape = shapeForm.repShape;
      const chosenColor = shapeForm.repColor;

      // Değerlendirme kategorisi:
      // A. Tam Doğru (Veridical): Ekranda tam o renk ve şekil kombinasyonu vardı.
      // B. Yanılsamalı Bağlaç (Illusory Conjunction): Şekil de ekrandaydı, renk de ekrandaydı ama FARKLI nesnelerdeydi!
      // C. Rastgele Hata (Intrusion): Ekranda hiç olmayan bir şekil veya renk seçildi.
      const exactMatch = items.some(it => it.shape.id === chosenShape && it.color.id === chosenColor);
      const shapeInScreen = items.some(it => it.shape.id === chosenShape);
      const colorInScreen = items.some(it => it.color.id === chosenColor);
      const isIllusoryConjunction = (!exactMatch && shapeInScreen && colorInScreen);

      trialsData.push({
        deneme: t + 1,
        sayılar_doğru_mu: numsCorrect ? 1 : 0,
        gerçek_nesneler: items.map(it => `${it.color.name} ${it.shape.name}`).join(' · '),
        bildirilen_nesne: `${COLORS.find(c => c.id === chosenColor).name} ${SHAPES.find(s => s.id === chosenShape).name}`,
        sonuç_tipi: exactMatch ? 'Tam Doğru' : isIllusoryConjunction ? 'YANILSAMALI BAĞLAÇ' : 'Başka Hata'
      });

      ctx.progress(t + 1, n);
    }

    const nIllusory = trialsData.filter(d => d.sonuç_tipi === 'YANILSAMALI BAĞLAÇ').length;
    const nExact = trialsData.filter(d => d.sonuç_tipi === 'Tam Doğru').length;
    const numAcc = U.mean(trialsData.map(d => d.sayılar_doğru_mu));

    const checks = [
      {
        ok: numAcc >= 0.5 ? true : 'warn',
        label: `Birincil Görev (Sayılar) Doğruluğu: ${U.pct(numAcc)}`,
        detail: 'Dikkatin sayılara odaklandığını kanıtlar. En az %50 başarı beklenir.'
      },
      {
        ok: true,
        label: `Yanılsamalı Bağlaç Sayısı: ${nIllusory} / ${n} (${U.pct(nIllusory / n)})`,
        detail: nIllusory > 0
          ? 'Treisman & Schmidt (1982) ile uyumlu: Renk ve şekil bağımsız algılandı ve dikkat yokluğunda yanlış birbirine yapıştı!'
          : 'Özellikleri başarıyla doğru kombinasyonlarında tuttunuz.'
      }
    ];

    return {
      summary: [
        { label: 'Yanılsamalı Bağlaç Oranı', value: U.pct(nIllusory / n) },
        { label: 'Tam Doğru Eşleşme', value: U.pct(nExact / n) },
        { label: 'Sayı Görevi Doğruluğu', value: U.pct(numAcc) },
        { label: 'Toplam Deneme', value: String(n) }
      ],
      checks,
      charts: [
        {
          title: 'Algılanan Nesne Türleri Dağılımı (%)',
          svg: U.svgBars({
            labels: ['Tam Doğru', 'Yanılsamalı Bağlaç', 'Hata'],
            values: [(nExact / n) * 100, (nIllusory / n) * 100, ((n - nExact - nIllusory) / n) * 100],
            max: 100,
            colors: ['#16a34a', '#ef4444', '#94a3b8'],
            unit: '%'
          })
        }
      ],
      interpretation: `<p>Treisman ve Schmidt (1982), <b>Özellik Bütünleştirme Kuramı</b> ile beynin şekil ve renkleri önce bağımsız ("serbest yüzen") özellikler olarak kaydettiğini göstermiştir.</p>
      <p>Bu deneyde <b>${nIllusory} kez Yanılsamalı Bağlaç</b> yaptınız. Dikkat sayılara odaklandığı için ortadaki renkler ve şekiller serbestçe birbirine karışmış ve ekranda hiç olmayan bileşimleri (örn. Yeşil Üçgen) gerçekmiş gibi algılamışsınızdır.</p>`,
      trials: trialsData
    };
  }
});
})();
