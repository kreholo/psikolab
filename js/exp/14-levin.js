(function () {
'use strict';
const U = Lab.u;

const CLIPS = [
  {
    id: 'dinner',
    title: 'Sahne 1: Akşam Yemeği Sohbeti (Film Kesmesi)',
    story: 'Kamera masadaki aktörü gösterir. Kamera açısı değiştiğinde (kesme) ne olduğunu izleyin.',
    durBefore: 3.5,
    durAfter: 3.5,
    changeType: 'Tabak / Giysi Değişimi',
    question: 'Kamera açısı kesildikten sonra sahnede ne değişti?',
    options: [
      { val: 'shirt', label: 'Aktörün tişört rengi mavidir kırmızıya döndü.' },
      { val: 'actor', label: 'Konuşan aktör tamamen başka biriyle değişti.' },
      { val: 'plate', label: 'Önündeki büyük servis tabağı kırmızı bir kaseye dönüştü.' },
      { val: 'none', label: 'Hiçbir şey değişmedi, sahne aynen devam etti.' }
    ],
    correctVal: 'shirt',
    draw(g, W, H, isAfter) {
      // Arka plan oda
      g.fillStyle = '#f8fafc'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#64748b'; g.fillRect(0, H * 0.65, W, H * 0.35); // Masa
      // Tabak
      g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(W / 2, H * 0.75, 70, 24, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#cbd5e1'; g.lineWidth = 3; g.stroke();
      // Çatal bıçak
      g.fillStyle = '#94a3b8'; g.fillRect(W / 2 - 95, H * 0.72, 8, 30); g.fillRect(W / 2 + 88, H * 0.72, 8, 30);

      // Aktör
      const ax = W / 2, ay = H * 0.42;
      // Tişört (KESME ÖNCESİ MAVİ, KESME SONRASI KIRMIZI!)
      g.fillStyle = isAfter ? '#ef4444' : '#2563eb';
      g.beginPath();
      g.roundRect ? g.roundRect(ax - 45, ay, 90, 75, 12) : g.rect(ax - 45, ay, 90, 75);
      g.fill();

      // Baş
      g.fillStyle = '#fbcfe8';
      g.beginPath(); g.arc(ax, ay - 24, 26, 0, Math.PI * 2); g.fill();
      // Saç
      g.fillStyle = '#451a03';
      g.beginPath(); g.arc(ax, ay - 32, 28, Math.PI, Math.PI * 2); g.fill();
    }
  },
  {
    id: 'door',
    title: 'Sahne 2: Üniversite Kampüsünde "Kapı Taşıma" Deneyi',
    story: 'Bir genç size yol tarifi soruyor. Konuşurken aranızdan kapı taşıyan iki işçi geçiyor...',
    durBefore: 3.5,
    durAfter: 3.5,
    changeType: 'Kişi Değişimi (Person Swap)',
    question: 'Kapı geçtikten sonra ne fark ettiniz?',
    options: [
      { val: 'actor', label: 'Size soru soran kişi tamamen farklı birine dönüştü (farklı yüz ve saç)!' },
      { val: 'door', label: 'Taşınan kapının rengi yeşilden sarıya döndü.' },
      { val: 'glasses', label: 'Kişi aniden gözlük taktı.' },
      { val: 'none', label: 'Aynı kişi konuşmaya devam etti.' }
    ],
    correctVal: 'actor',
    draw(g, W, H, isAfter, doorX) {
      // Kampüs dış mekan
      g.fillStyle = '#bae6fd'; g.fillRect(0, 0, W, H * 0.6);
      g.fillStyle = '#4ade80'; g.fillRect(0, H * 0.6, W, H * 0.4);
      // Ağaçlar
      g.fillStyle = '#166534'; g.beginPath(); g.arc(70, H * 0.55, 50, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#15803d'; g.beginPath(); g.arc(W - 80, H * 0.55, 60, 0, Math.PI * 2); g.fill();

      // Soru soran kişi (ÖNCE: Sarı saçlı genç, SONRA: Tamamen farklı koyu saçlı, farklı yüz yapısında biri!)
      const px = W / 2, py = H * 0.62;
      g.fillStyle = isAfter ? '#0f172a' : '#1e3a8a'; // Ceket
      g.beginPath();
      g.roundRect ? g.roundRect(px - 30, py - 40, 60, 80, 8) : g.rect(px - 30, py - 40, 60, 80);
      g.fill();

      // Baş ve Saç
      g.fillStyle = isAfter ? '#fed7aa' : '#fecdd3';
      g.beginPath(); g.arc(px, py - 60, 20, 0, Math.PI * 2); g.fill();

      if (isAfter) {
        // İkinci kişi: Siyah şapkalı / bıyıklı
        g.fillStyle = '#18181b';
        g.beginPath(); g.arc(px, py - 70, 22, Math.PI, Math.PI * 2); g.fill();
        g.fillRect(px - 6, py - 52, 12, 4); // Bıyık
      } else {
        // Birinci kişi: Sarı dalgalı saç
        g.fillStyle = '#eab308';
        g.beginPath(); g.arc(px, py - 65, 24, Math.PI, Math.PI * 2); g.fill();
      }

      // Kapı (Eğer geçiş anındaysa)
      if (doorX !== null && doorX !== undefined) {
        g.fillStyle = '#78350f';
        g.fillRect(doorX - 60, H * 0.25, 120, H * 0.65);
        g.strokeStyle = '#451a03'; g.lineWidth = 6;
        g.strokeRect(doorX - 60, H * 0.25, 120, H * 0.65);
        // Kapı kolu
        g.fillStyle = '#fde047'; g.beginPath(); g.arc(doorX + 38, H * 0.58, 6, 0, Math.PI * 2); g.fill();
        // İşçiler
        g.fillStyle = '#ea580c';
        g.fillRect(doorX - 85, H * 0.45, 20, 50);
        g.fillRect(doorX + 65, H * 0.45, 20, 50);
      }
    }
  }
];

Lab.register({
  id: 'levin', icon: '🎬', short: 'Levin & Simons', title: 'Levin & Simons (1997) – Filmlerde ve Gerçek Hayatta Değişim Körlüğü', group: 'Seçici dikkat / Körlük',
  tagline: 'Kamera açısı kesildiğinde veya aradan bir kapı geçtiğinde karşınızdaki kişinin değiştiğini anlar mısınız?',
  about: `<p><b>Daniel Levin ve Daniel Simons (1997, 1998)</b>, değişim körlüğünün sadece laboratuvar resimleriyle sınırlı olmadığını, <b>sinema filmlerinde</b> ve hatta <b>gerçek hayattaki yüz yüze konuşmalarda</b> dahi şaşırtıcı boyutlarda gerçekleştiğini ispatladı.</p>
  <p>Ünlü <b>“Kapı Taşıma” (The Door Study)</b> deneyinde, bir araştırmacı yoldan geçen birine haritayla adres sorar. Konuşma sürerken aralarından büyük bir kapı taşıyan iki işçi geçer. Kapının arkasından gizlice <b>tamamen farklı bir araştırmacı</b> geçer ve konuşmayı devralır! Yoldan geçenlerin <b>%50'sinden fazlası</b> az önce konuştukları kişinin tamamen değiştiğini fark etmemiştir.</p>`,
  howto: `<ol>
  <li>Ekranda kısa bir sahne canlandırılacaktır. Sahneyi ve karakterleri dikkatle izleyin.</li>
  <li>Kamera kesmesi veya araya giren bir cisimden (kapı) sonra sahne devam eder.</li>
  <li>Klip bittiğinde neyin değiştiğini tahmin edin ve eminlik derecenizi seçin.</li>
  </ol>`,
  verify: `<ul>
  <li>Değişimi fark edip etmediğiniz ve hangi ögenin değiştiğini doğru bilip bilmediğiniz denetlenir.</li>
  <li>Levin & Simons literatür verisiyle (%67 değişim körlüğü) kıyaslama yapılır.</li>
  </ul>`,
  refs: 'Levin, D. T., & Simons, D. J. (1997). Failure to detect changes to attended objects in motion pictures. Psychon. Bull. Rev., 4(4), 501–506. · Simons, D. J., & Levin, D. T. (1998). Failure to detect changes to people during a real-world interaction. Psychon. Bull. Rev., 5(4), 644–649.',
  settings: [
    { group: 'Klip Süreleri' },
    { key: 'clipDurS', label: 'Sahne süresi (kesme öncesi/sonrası)', type: 'number', def: 3.5, min: 2.0, max: 8.0, step: 0.5, unit: 'sn' }
  ],
  testSettings: { clipDurS: 1.0 },
  unit() {
    return [
      ['Klipler tanımlı', CLIPS.length >= 2],
      ['Tüm kliplerin soru ve seçenekleri mevcut', CLIPS.every(c => c.question && c.options.length >= 3)]
    ];
  },
  async run(ctx) {
    const s = ctx.s;
    const W = 480, H = 340;
    const C = ctx.canvas(W, H, { maxWidth: 500 });
    const g = C.g;

    await ctx.message(`<h3>Levin & Simons (1997, 1998) Değişim Körlüğü</h3>
      <p>Şimdi iki ayrı sahne izleyeceksiniz:</p>
      <p>1. Bir film karesi (kamera kesmesi).<br>
      2. Kampüste geçen meşhur "Kapı Taşıma" olayı.</p>
      <p>Her sahneyi dikkatle izleyin, ardından neyin değiştiği sorulacaktır.</p>`, 'İlk Sahneyi İzle');

    const rows = [];

    for (let cIdx = 0; cIdx < CLIPS.length; cIdx++) {
      const clip = CLIPS[cIdx];
      ctx.hud(`<b>${clip.title}</b> – İzleyin...`);

      if (clip.id === 'dinner') {
        // Kesme öncesi
        await ctx.animate(t => {
          clip.draw(g, W, H, false);
          return t >= s.clipDurS;
        });

        // KAMERA KESMESİ (Siyah ekran / flaş)
        g.fillStyle = '#0f172a';
        g.fillRect(0, 0, W, H);
        await ctx.wait(Lab.test ? 30 : 250);

        // Kesme sonrası
        await ctx.animate(t => {
          clip.draw(g, W, H, true);
          return t >= s.clipDurS;
        });

      } else if (clip.id === 'door') {
        // Kapı taşıma animasyonu
        const half = s.clipDurS;
        // 1. Konuşma
        await ctx.animate(t => {
          clip.draw(g, W, H, false, null);
          return t >= half;
        });

        // 2. KAPI GEÇİŞİ (Ekranı soldan sağa kaplayan kapı)
        const doorTime = Lab.test ? 0.3 : 1.6;
        await ctx.animate(t => {
          const prog = t / doorTime;
          const dx = prog * (W + 200) - 100;
          // Kapı ortayı geçerken arkadaki kişi değişiyor!
          const isSwapped = (prog > 0.5);
          clip.draw(g, W, H, isSwapped, dx);
          return t >= doorTime;
        });

        // 3. Yeni kişiyle konuşma devam ediyor
        await ctx.animate(t => {
          clip.draw(g, W, H, true, null);
          return t >= half;
        });
      }

      ctx.clear();

      // Soru formu
      const rep = await ctx.form(`
        <div style="font-weight:700;font-size:18px;margin-bottom:8px">${clip.title}</div>
        <p style="color:var(--muted)">${clip.story}</p>
        <fieldset>
          <legend>${clip.question}</legend>
          ${clip.options.map(o => `<label class="opt"><input type="radio" name="ans" value="${o.val}"> ${o.label}</label>`).join('')}
        </fieldset>
        <fieldset style="margin-top:12px">
          <legend>Cevabınızdan ne kadar eminsiniz?</legend>
          <label class="opt"><input type="radio" name="conf" value="sure"> %100 Eminim (Gözümle gördüm)</label>
          <label class="opt"><input type="radio" name="conf" value="guess"> Tahmin yürütüyorum / Fark etmedim</label>
        </fieldset>
      `, {
        submit: 'Cevabı Onayla',
        validate: d => (d.ans && d.conf) ? null : 'Lütfen iki soruyu da yanıtlayın.'
      });

      const correct = (rep.ans === clip.correctVal);
      rows.push({
        sahne: clip.title,
        değişim_türü: clip.changeType,
        verilen_yanıt: clip.options.find(o => o.val === rep.ans).label,
        doğru_mu: correct ? 'DOĞRU BİLDİ' : 'FARK ETMEDİ (Körlük)',
        eminlik: rep.conf === 'sure' ? 'Emin' : 'Tahmin'
      });

      ctx.progress(cIdx + 1, CLIPS.length);

      if (cIdx < CLIPS.length - 1) {
        await ctx.message(`<h3>1. Sahne Tamamlandı</h3><p>Şimdi 2. Sahneye (Kapı Taşıma deneyi) geçiyoruz.</p>`, 'Sonraki Sahneyi İzle');
      }
    }

    const nCorrect = rows.filter(r => r.doğru_mu.includes('DOĞRU')).length;
    const rate = nCorrect / rows.length;

    const checks = [
      {
        ok: true,
        label: `Değişimleri Tespit Başarısı: ${nCorrect} / ${rows.length} (${U.pct(rate)})`,
        detail: nCorrect === 0 
          ? 'Levin & Simons (1997) bulgusuyla tam uyumlu: Değişimleri fark etmediniz (Değişim Körlüğü yaşandı).'
          : 'En az bir bariz değişimi yakalamayı başardınız.'
      },
      {
        ok: true,
        label: 'Literatürdeki Körlük Oranı: %67 - %75',
        detail: 'İnsanlar dünyayı kesintisiz ve zengin detaylı algıladıklarını zanneder, oysa görsel hafızamız sadece kaba bir anlam özetini (gist) tutar.'
      }
    ];

    return {
      summary: [
        { label: 'Doğru Tespit', value: `${nCorrect} / ${rows.length}` },
        { label: 'Değişim Körlüğü Yaşandı mı?', value: nCorrect < rows.length ? 'Evet' : 'Hayır' },
        { label: 'Levin & Simons Ortalaması', value: '%67 Körlük' }
      ],
      checks,
      charts: [
        {
          title: 'Değişimi Tespit Oranı (%)',
          svg: U.svgBars({
            labels: ['Sizin Başarınız', 'Literatür (Levin & Simons)'],
            values: [rate * 100, 33],
            max: 100,
            colors: [rate > 0.5 ? '#16a34a' : '#ef4444', '#64748b'],
            unit: '%'
          })
        }
      ],
      interpretation: `<p>Levin ve Simons (1997, 1998) deneyleri, insanların görsel çevreye dair kesintisiz bir detay kaydı tuttuğu yanılsamasını (<b>Değişim Körlüğü İllüzyonu</b>) yıkmıştır.</p>
      <p>Gerçek hayatta karşımızdaki kişinin tişörtü veya kimliği bile değiştiğinde, eğer o özelliğe spesifik olarak odaklanmamışsak beynimiz genel durumu <i>“karşımda konuşan biri var”</i> şeklinde özetler ve somut detay değişimlerini tamamen gözden kaçırır.</p>`,
      trials: rows
    };
  }
});
})();
