(function () {
'use strict';
const U = Lab.u;

Lab.register({
  id: 'mackrock', icon: '👁️', short: 'Mack & Rock', title: 'Mack & Rock (1998) – Dikkatsizlik Körlüğü', group: 'Seçici dikkat / Körlük',
  tagline: 'Gözünün tam önünde olsa bile, dikkat etmediğin bir şeyi görebilir misin?',
  about: `<p><b>Arien Mack ve Irvin Rock (1998)</b>, “Dikkatsizlik Körlüğü” (<i>Inattentional Blindness</i>) kavramını literatüre kazandıran klasik deneylerini gerçekleştirdi.</p>
  <p>Katılımcılara ekranda çok kısa süre (200 ms) yanıp sönen bir <b>artı (+)</b> işareti gösterildi. Görevleri basitti: <i>“Artının yatay kolu mu yoksa dikey kolu mu daha uzun?”</i></p>
  <p>İlk birkaç denemeden sonra, <b>Kritik Denemede</b> artının hemen yanına beklenmedik parlak bir geometrik şekil (kırmızı daire veya kare) yerleştirildi. Deneme biter bitmez sorulduğunda katılımcıların <b>%60 ila %85'i</b> ekranda artı dışında hiçbir şey görmediklerini söyledi! Bu bulgu, retinamıza düşen bir görüntünün bilince ulaşması için <b>dikkatin zorunlu</b> olduğunu kanıtladı.</p>`,
  howto: `<ol>
  <li>Ekranda anlık belirecek <b>artı (+)</b> işaretine bakın.</li>
  <li>Artının <b>YATAY</b> kolu mu (<kbd>Y</kbd>) yoksa <b>DİKEY</b> kolu mu (<kbd>D</kbd>) daha uzun, karar verip düğmeye basın.</li>
  <li>Birkaç deneme bu şekilde devam edecektir. Her denemede olabildiğince dikkatli olun.</li>
  </ol>`,
  verify: `<ul>
  <li>Kritik denemede beklenmedik cismi fark edip etmediğiniz kaydedilir.</li>
  <li>Kontrol denemesinde (dikkat serbestken) cismi fark etme oranı kıyaslanır.</li>
  </ul>`,
  refs: 'Mack, A., & Rock, I. (1998). Inattentional Blindness. MIT Press. · Most, S. B., et al. (2001). How not to be seen: The contribution of similarity and spatial proximity to inattentional blindness.',
  settings: [
    { group: 'Zamanlama' },
    { key: 'flashMs', label: 'Artı gösterim süresi', type: 'number', def: 200, min: 100, max: 1000, step: 50, unit: 'ms' },
    { key: 'fixMs', label: 'Odak noktası süresi', type: 'number', def: 800, min: 300, max: 2000, step: 100, unit: 'ms' },
    { group: 'Deneme Yapısı' },
    { key: 'preTrials', label: 'Kritik deneme öncesi deneme sayısı', type: 'number', def: 3, min: 2, max: 8 },
    { key: 'diffPx', label: 'Kol uzunluk farkı', type: 'number', def: 18, min: 6, max: 40, unit: 'px' }
  ],
  testSettings: { flashMs: 30, fixMs: 30, preTrials: 2 },
  unit() {
    return [
      ['Lab.u hazır', typeof Lab.u === 'object']
    ];
  },
  async run(ctx) {
    const s = ctx.s;
    const W = 400, H = 360;
    const C = ctx.canvas(W, H, { maxWidth: 420 });
    const g = C.g;

    await ctx.message(`<h3>Mack & Rock (1998) Dikkatsizlik Körlüğü</h3>
      <p>Ekranda belirecek büyük artı işaretine bakın.</p>
      <p>Soru: <b>Hangi kol daha uzun?</b><br>
      <b>Yatay kol mu</b> yoksa <b>Dikey kol mu?</b></p>
      <p>Artı çok kısa süre gösterilecektir. Gözünüzü merkezden ayırmayın.</p>`, 'Başla');

    const totalTrials = s.preTrials + 2; // Ön denemeler + 1 Kritik Deneme + 1 Kontrol Denemesi
    const critIndex = s.preTrials; // 0-based
    const controlIndex = s.preTrials + 1;
    const trialsData = [];

    const drawCross = (horizLen, vertLen, extraShape) => {
      g.fillStyle = '#f1f3fa';
      g.fillRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H / 2;

      g.lineWidth = 6;
      g.strokeStyle = '#1b2133';
      g.lineCap = 'round';

      // Yatay kol
      g.beginPath();
      g.moveTo(cx - horizLen / 2, cy);
      g.lineTo(cx + horizLen / 2, cy);
      g.stroke();

      // Dikey kol
      g.beginPath();
      g.moveTo(cx, cy - vertLen / 2);
      g.lineTo(cx, cy + vertLen / 2);
      g.stroke();

      // Beklenmedik ekstra şekil (Kritik veya kontrol denemesinde)
      if (extraShape) {
        g.fillStyle = '#ef4444';
        g.beginPath();
        // Merkezden hafifçe sağ-üst çeyreğe
        g.arc(cx + 65, cy - 55, 14, 0, Math.PI * 2);
        g.fill();
      }
    };

    let noticedInCritical = false;

    for (let t = 0; t < totalTrials; t++) {
      const isCritical = (t === critIndex);
      const isControl = (t === controlIndex);

      const baseLen = 120;
      const diff = s.diffPx;
      const horizLonger = Math.random() < 0.5;
      const hLen = horizLonger ? baseLen + diff : baseLen - diff;
      const vLen = horizLonger ? baseLen - diff : baseLen + diff;

      // Odak ekranı
      g.fillStyle = '#f1f3fa';
      g.fillRect(0, 0, W, H);
      g.fillStyle = '#1b2133';
      g.beginPath();
      g.arc(W / 2, H / 2, 4, 0, Math.PI * 2);
      g.fill();
      ctx.setControls();
      await ctx.wait(s.fixMs);

      // Artı ekranı (flaş)
      drawCross(hLen, vLen, isCritical || isControl);
      await ctx.wait(s.flashMs);

      // Boşalt
      g.fillStyle = '#f1f3fa';
      g.fillRect(0, 0, W, H);

      // Görev sorusu
      const resp = await ctx.waitChoice([
        { label: 'Yatay Kol Daha Uzun (Y)', value: 'horiz', key: 'y' },
        { label: 'Dikey Kol Daha Uzun (D)', value: 'vert', key: 'd' }
      ], {
        botPick: horizLonger ? 'horiz' : 'vert'
      });

      const primaryCorrect = (resp.value === 'horiz') === horizLonger;

      if (isCritical) {
        // Kritik Soru Anketi
        const critForm = await ctx.form(`
          <fieldset>
            <legend>Bu son denemede ekranın herhangi bir yerinde artı işareti DIŞINDA olağan dışı bir şey gördünüz mü?</legend>
            <label class="opt"><input type="radio" name="saw" value="no"> Hayır, sadece artı işaretini gördüm.</label>
            <label class="opt"><input type="radio" name="saw" value="yes"> Evet, artının yanında ek bir şekil belirdi!</label>
          </fieldset>
          <fieldset style="margin-top:12px">
            <legend>Eğer gördüyseniz, o şekil neye benziyordu? (Görmediyseniz tahmin edin)</legend>
            <label class="opt"><input type="radio" name="shape" value="circle"> Kırmızı bir daire</label>
            <label class="opt"><input type="radio" name="shape" value="triangle"> Mavi bir üçgen</label>
            <label class="opt"><input type="radio" name="shape" value="star"> Sarı bir yıldız</label>
          </fieldset>
        `, {
          submit: 'Yanıtı Kaydet',
          validate: d => (d.saw && d.shape) ? null : 'Lütfen iki soruyu da yanıtlayın.'
        });

        noticedInCritical = (critForm.saw === 'yes');

        trialsData.push({
          deneme: t + 1,
          tip: 'KRİTİK DENEME',
          birincil_görev_doğru: primaryCorrect ? 1 : 0,
          beklenmedik_cisim_var_mıydı: 1,
          cisim_fark_edildi_mi: noticedInCritical ? 'Evet' : 'HAYIR (Körlük)',
          şekil_tahmini: critForm.shape
        });

        await ctx.message(`<h3>Son Kontrol Denemesi</h3>
          <p>Şimdi son bir kez daha artı gösterilecek.</p>
          <p>Bu defa hem artıya hem de ekranda belirebilecek herhangi bir şekle dikkat edin.</p>`, 'Son Denemeyi Yap');

      } else {
        trialsData.push({
          deneme: t + 1,
          tip: isControl ? 'KONTROL DENEMESİ' : 'Ön Deneme',
          birincil_görev_doğru: primaryCorrect ? 1 : 0,
          beklenmedik_cisim_var_mıydı: isControl ? 1 : 0,
          cisim_fark_edildi_mi: isControl ? 'Evet (Kontrol)' : '–',
          şekil_tahmini: '–'
        });
      }

      ctx.progress(t + 1, totalTrials);
      await ctx.wait(300);
    }

    const checks = [
      {
        ok: true,
        label: `Kritik Denemede Cisim Fark Edildi mi: ${noticedInCritical ? 'EVET (Görüldü)' : 'HAYIR (Dikkatsizlik Körlüğü Yaşandı)'}`,
        detail: !noticedInCritical
          ? 'Mack & Rock (1998) literatür bulgusuyla tam uyumlu: Gözünüzün önündeki kırmızı daireyi göremediniz!'
          : 'Dikkatiniz birincil görevden taşıp çevreye yayıldı ve cismi fark ettiniz.'
      },
      {
        ok: true,
        label: 'Dikkatsizlik Körlüğü Literatür Oranı: %60 - %85',
        detail: 'İnsanların büyük çoğunluğu odaklandıkları görev nedeniyle açıkça görünen cisimleri kaçırır.'
      }
    ];

    return {
      summary: [
        { label: 'Kritik Cisim Fark Edildi mi?', value: noticedInCritical ? 'Evet' : 'Hayır (Körlük)' },
        { label: 'Birincil Görev Başarısı', value: U.pct(U.mean(trialsData.map(r => r.birincil_görev_doğru))) },
        { label: 'Literatür Körlük Oranı', value: '%60 – %85' }
      ],
      checks,
      charts: [
        {
          title: 'Mack & Rock: Kritik Cismin Fark Edilme Oranı',
          svg: U.svgBars({
            labels: ['Bu Testteki Sonucunuz', 'Literatür (Mack & Rock)'],
            values: [noticedInCritical ? 100 : 0, 30],
            max: 100,
            colors: [noticedInCritical ? '#16a34a' : '#ef4444', '#64748b'],
            unit: '%'
          })
        }
      ],
      interpretation: `<p>Mack ve Rock (1998), görsel algının sadece gözün baktığı yerle sınırlı olmadığını, <b>dikkat olmadan bilinçli görmenin gerçekleşmediğini</b> ispatlamıştır.</p>
      <p>Kritik denemede şekli <b>${noticedInCritical ? 'fark ettiniz' : 'fark etmediniz (Dikkatsizlik Körlüğü gerçekleşti)'}</b>. İnsan beyni kapasitesini kol uzunluğunu ölçmeye adadığında, hemen yanındaki parlak kırmızı cismi bile filtreleyip bilince taşımayabilir.</p>`,
      trials: trialsData
    };
  }
});
})();
