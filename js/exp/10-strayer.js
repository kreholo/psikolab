(function () {
'use strict';
const U = Lab.u;

Lab.register({
  id: 'strayer', icon: '📱', short: 'Strayer & Johnston', title: 'Strayer & Johnston (2001) – Cep Telefonu ve Sürüş Simülasyonu', group: 'Uygulamalı Dikkat / Sürüş',
  tagline: 'Eller serbest olsa bile telefonla konuşmak kırmızı ışık kaçırma oranını iki katına çıkarır mı?',
  about: `<p><b>David Strayer ve William Johnston (2001)</b>, sürüş simülatöründe cep telefonuyla konuşmanın etkilerini inceledi.</p>
  <p>Sürücüler kırmızı ışık yandığında frene basmak zorundaydı. İki koşul karşılaştırıldı:
  <ul>
    <li><b>Tek Görev (Sadece Sürüş):</b> Sürücü yalnızca yola ve ışıklara odaklanır.</li>
    <li><b>Çift Görev (Eller Serbest Telefon Görüşmesi):</b> Sürücü araç kullanırken aynı anda telefonda sorulara yanıt verir.</li>
  </ul>
  Sonuç: Telefonla konuşmak, kırmızı ışığı <b>kaçırma olasılığını iki katına çıkardı</b> ve fren tepki süresini belirgin şekilde uzattı. Radyo dinlemek ise performansı etkilemedi. Bu durum, sorunun fiziksel olarak telefonu tutmak değil, <b>zihinsel dikkat bölünmesi</b> olduğunu kanıtladı.</p>`,
  howto: `<ol>
  <li>Sürüş simülasyonu iki bloktan oluşur: Önce <b>Tek Görev</b> (sadece sürüş), ardından <b>Çift Görev</b> (telefonla konuşarak sürüş).</li>
  <li>Şeridinizi korurken yukarıda yanan <b>KIRMIZI</b> ışığı gördüğünüz an hemen <b>BOŞLUK</b> veya <b>FREN</b> butonuna basın. Yeşil ışıklarda basmayın.</li>
  <li>İkinci blokta telefon soruları sesli/yazılı olarak sorulacaktır.</li>
  </ol>`,
  verify: `<ul>
  <li>Her iki blokta da kırmızı ışık sayısı ve kaçırılan kırmızı ışık yüzdesi hesaplanır.</li>
  <li>Çift görevde kırmızı ışık kaçırma oranı ve fren tepki süresi artışı literatürle kıyaslanır.</li>
  </ul>`,
  refs: 'Strayer, D. L., & Johnston, W. A. (2001). Driven to distraction: Dual-task studies of simulated driving and conversing on a cellular telephone. Psychol. Sci., 12(6), 462–466.',
  settings: [
    { group: 'Blok Süreleri' },
    { key: 'blockDurS', label: 'Her blok süresi', type: 'number', def: 35, min: 15, max: 120, step: 5, unit: 'sn' },
    { key: 'lightInterval', label: 'Trafik ışığı çıkma aralığı', type: 'number', def: 4.5, min: 2.5, max: 10, step: 0.5, unit: 'sn' },
    { key: 'lightShowMs', label: 'Işığın açık kalma süresi', type: 'number', def: 1400, min: 600, max: 3000, step: 100, unit: 'ms' },
    { group: 'Telefon Konuşması' },
    { key: 'convoInterval', label: 'Telefon soru aralığı', type: 'number', def: 7, min: 4, max: 15, step: 1, unit: 'sn' }
  ],
  testSettings: { blockDurS: 8, lightInterval: 2.5, lightShowMs: 1200, convoInterval: 3 },
  unit() {
    return [
      ['Lab.drive motoru mevcut', typeof Lab.drive === 'object' && typeof Lab.drive.run === 'function']
    ];
  },
  async run(ctx) {
    const s = ctx.s;

    // 1. BLOK: TEK GÖREV (Sadece Sürüş)
    await ctx.message(`<h3>1. Bölüm: Tek Görev (Yalnızca Sürüş)</h3>
      <p>Bu bölümde yalnızca yola odaklanın.</p>
      <p>Yukarıdaki direkte <b>KIRMIZI</b> ışık yandığında gecikmeden <b>BOŞLUK</b> tuşuna veya <b>FREN</b> butonuna basın. Yeşil ışıkta basmayın.</p>`, '1. Bölümü Başlat');

    const singleRes = await Lab.drive.run(ctx, {
      durationS: s.blockDurS,
      trackAmp: 0.8,
      lead: { on: false },
      distract: { on: false },
      convo: { on: false },
      lights: {
        on: true,
        meanIntervalS: s.lightInterval,
        showMs: s.lightShowMs
      },
      hud: t => `1. Bölüm (Tek Görev): ${Math.round(t)}/${s.blockDurS} sn`
    });

    // 2. BLOK: ÇİFT GÖREV (Telefonla Sürüş)
    await ctx.message(`<h3>2. Bölüm: Çift Görev (Telefonla Konuşma)</h3>
      <p>Şimdi sürüş yaparken aynı anda arayan kişinin sorularına (eller serbest modunda) yanıt vermeniz gerekecek.</p>
      <p>Yine <b>KIRMIZI</b> ışık çıktığında anında <b>FREN</b> yapın.</p>`, '2. Bölümü Başlat');

    const dualRes = await Lab.drive.run(ctx, {
      durationS: s.blockDurS,
      trackAmp: 0.8,
      lead: { on: false },
      distract: { on: false },
      convo: {
        on: true,
        intervalS: s.convoInterval
      },
      lights: {
        on: true,
        meanIntervalS: s.lightInterval,
        showMs: s.lightShowMs
      },
      hud: t => `2. Bölüm (Telefonlu): ${Math.round(t)}/${s.blockDurS} sn`
    });

    // Analiz
    const processLights = (lights) => {
      const reds = lights.filter(l => l.color === 'red');
      const hits = reds.filter(l => l.hit);
      const misses = reds.filter(l => l.miss);
      const rts = hits.map(l => l.rt).filter(x => typeof x === 'number' && isFinite(x));
      return {
        nRed: reds.length,
        missCount: misses.length,
        missRate: reds.length > 0 ? (misses.length / reds.length) : 0,
        meanRT: U.mean(rts),
        rts
      };
    };

    const sStats = processLights(singleRes.lights || []);
    const dStats = processLights(dualRes.lights || []);

    const missDiff = (dStats.missRate - sStats.missRate) * 100;
    const rtDiff = dStats.meanRT - sStats.meanRT;

    const checks = [
      {
        ok: (sStats.nRed >= 2 && dStats.nRed >= 2) ? true : 'warn',
        label: `Kırmızı Işık Sayısı: Tek Görev=${sStats.nRed}, Çift Görev=${dStats.nRed}`,
        detail: 'İstatistik için yeterli kırmızı ışık üretildi.'
      },
      {
        ok: true,
        label: `Kaçırılan Kırmızı Işık Oranı: Tek=${U.pct(sStats.missRate)}, Telefonlu=${U.pct(dStats.missRate)}`,
        detail: dStats.missRate >= sStats.missRate
          ? 'Strayer & Johnston (2001) ile uyumlu: Telefon konuşması kırmızı ışık kaçırma riskini artırdı!'
          : 'Telefon konuşmasına rağmen ışıklara odaklanmayı başardınız.'
      },
      {
        ok: true,
        label: `Fren Tepki Süresi: Tek=${U.ms(sStats.meanRT)}, Telefonlu=${U.ms(dStats.meanRT)} (Fark: ${U.fmt(rtDiff)} ms)`,
        detail: rtDiff > 0 ? 'Telefon görüşmesi fren reaksiyonunu geciktirdi.' : 'Tepki süreleri benzer kaldı.'
      }
    ];

    const rows = [
      ...singleRes.lights.map((l, i) => ({
        blok: 'Tek Görev (Sadece Sürüş)',
        ışık_no: i + 1,
        renk: l.color === 'red' ? 'Kırmızı' : 'Yeşil',
        sonuç: l.hit ? 'Fren yapıldı' : l.miss ? 'KAÇIRILDI' : l.fa ? 'Yeşilde basıldı' : 'Doğru pas',
        fren_rt_ms: l.rt != null ? Math.round(l.rt) : '–'
      })),
      ...dualRes.lights.map((l, i) => ({
        blok: 'Çift Görev (Telefonla)',
        ışık_no: i + 1,
        renk: l.color === 'red' ? 'Kırmızı' : 'Yeşil',
        sonuç: l.hit ? 'Fren yapıldı' : l.miss ? 'KAÇIRILDI' : l.fa ? 'Yeşilde basıldı' : 'Doğru pas',
        fren_rt_ms: l.rt != null ? Math.round(l.rt) : '–'
      }))
    ];

    return {
      summary: [
        { label: 'Kaçırılan Işık (Tek)', value: U.pct(sStats.missRate) },
        { label: 'Kaçırılan Işık (Telefon)', value: U.pct(dStats.missRate) },
        { label: 'Fren RT (Tek Görev)', value: U.ms(sStats.meanRT) },
        { label: 'Fren RT (Telefonlu)', value: U.ms(dStats.meanRT) }
      ],
      checks,
      charts: [
        {
          title: 'Kırmızı Işığı Kaçırma Oranı (%)',
          svg: U.svgBars({
            labels: ['Sadece Sürüş', 'Telefonla Sürüş'],
            values: [sStats.missRate * 100, dStats.missRate * 100],
            max: Math.max(30, Math.max(sStats.missRate, dStats.missRate) * 110),
            colors: ['#16a34a', '#ef4444'],
            unit: '%'
          })
        },
        {
          title: 'Ortalama Fren Tepki Süresi (ms)',
          svg: U.svgBars({
            labels: ['Sadece Sürüş', 'Telefonla Sürüş'],
            values: [sStats.meanRT, dStats.meanRT],
            colors: ['#0ea5e9', '#f59e0b'],
            unit: 'ms'
          })
        }
      ],
      interpretation: `<p>Strayer ve Johnston (2001), eller serbest telefonla konuşmanın bile <b>kırmızı ışığı kaçırma olasılığını iki katına çıkardığını</b> ve fren reaksiyon süresini yaklaşık 50 ms geciktirdiğini saptamıştır.</p>
      <p>Bu gecikme otoyol hızında (100 km/sa) aracın durma mesafesine 1.5 - 2 metre ekler; kaçırılan ışık ise doğrudan kavşak kazalarına yol açar. Sorun ellerin meşgul olması değil, <b>bilişsel dikkatin yoldan kopmasıdır</b>.</p>`,
      trials: rows
    };
  }
});
})();
