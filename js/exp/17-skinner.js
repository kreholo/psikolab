(function () {
'use strict';
const U = Lab.u;

Lab.register({
  id: 'skinner', icon: '📦', short: 'Skinner Kutusu', title: 'B. F. Skinner (1938) – Edimsel Koşullanma ve Pekiştirme Tarifeleri', group: 'Öğrenme ve Koşullanma',
  tagline: 'Kaldıraç, yem ve kümülatif kayıt cihazı: Pekiştirme tarifeleri davranışı nasıl yönetir?',
  about: `<p><b>B. F. Skinner (1938, 1953)</b>, davranışın sonuçları tarafından şekillendirildiğini savunan <b>Edimsel Koşullanma (Operant Conditioning)</b> kuramını ve ünlü <b>Skinner Kutusunu</b> geliştirdi.</p>
  <p>Kutudaki hayvan (veya insan), bir manivelaya (kaldıraç) basarak ödül (yem) kazanır. Skinner, ödülün verilme sıklığı ve kuralının (<b>Pekiştirme Tarifeleri</b>) davranışı kökten değiştirdiğini gösterdi:
  <ul>
    <li><b>Sürekli Pekiştirme (CRF):</b> Her basışta 1 yem. Hızlı öğrenilir, çabuk söner.</li>
    <li><b>Sabit Oranlı (FR - Fixed Ratio, örn. FR-5):</b> Her 5 basışta 1 yem. Ödül sonrasında kısa duraklama, ardından hızlı basış.</li>
    <li><b>Değişken Oranlı (VR - Variable Ratio, örn. VR-5):</b> Ortalama 5 basışta bir (kumar makineleri prensibi!). En yüksek ve hiç durmayan basış hızı; sönmeye karşı en dirençli tarife.</li>
    <li><b>Sabit Aralıklı (FI - Fixed Interval, örn. FI-8s):</b> Süre dolduktan sonraki ilk basış yem verir. Tipik "deniz kabuğu" (scallop) eğrisi oluşturur: süre başında yavaş, sonuna doğru fırtına gibi basış.</li>
  </ul></p>`,
  howto: `<ol>
  <li>Tarifenizi seçin (CRF, FR, VR, FI veya VI).</li>
  <li>Kutudaki <b>MANİVELA / KALDIRAÇ</b> butonuna dokunun veya <kbd>BOŞLUK</kbd> tuşuna basın.</li>
  <li>Sağ taraftaki meşhur <b>Kümülatif Kayıt Cihazı (Cumulative Recorder)</b> her basışınızda kalemi yukarı doğru kaydıracaktır!</li>
  <li>Farklı tarifelerin basış hızınızı ve sabrınızı nasıl manipüle ettiğini deneyimleyin.</li>
  </ol>`,
  verify: `<ul>
  <li>Seçilen tarifeye uygun basış ve yem kazanma oranları kontrol edilir.</li>
  <li>Kümülatif basış eğrisi oluşturulur ve Skinner'ın klasik grafik profiliyle kıyaslanır.</li>
  </ul>`,
  refs: 'Skinner, B. F. (1938). The Behavior of Organisms: An Experimental Analysis. Appleton-Century. · Ferster, C. B., & Skinner, B. F. (1957). Schedules of Reinforcement.',
  settings: [
    { group: 'Pekiştirme Tarifesi' },
    { key: 'schedule', label: 'Pekiştirme tarifesi', type: 'select', def: 'VR', options: [
      ['CRF', 'Sürekli (Her basışta ödül)'],
      ['FR', 'Sabit Oranlı (FR-5: Her 5 basışta)'],
      ['VR', 'Değişken Oranlı (VR-5: Kumarhane/Slot)'],
      ['FI', 'Sabit Aralıklı (FI-8s: 8 saniyede bir)'],
      ['VI', 'Değişken Aralıklı (VI-8s: Ortalama 8 saniyede)']
    ] },
    { key: 'durationS', label: 'Oturum süresi', type: 'number', def: 30, min: 10, max: 120, step: 5, unit: 'sn' },
    { group: 'Tarife Parametreleri' },
    { key: 'ratioN', label: 'Oranlı tarifeler için N (basış sayısı)', type: 'number', def: 5, min: 2, max: 20 },
    { key: 'intervalS', label: 'Aralıklı tarifeler için süre (sn)', type: 'number', def: 6, min: 2, max: 20 }
  ],
  testSettings: { durationS: 5, ratioN: 3, intervalS: 3 },
  unit() {
    return [
      ['Lab.u hazır', typeof Lab.u === 'object']
    ];
  },
  async run(ctx) {
    const s = ctx.s;
    const sched = s.schedule;
    const W = 520, H = 340;
    const C = ctx.canvas(W, H, { maxWidth: 540 });
    const g = C.g;

    const schedNames = {
      CRF: 'Sürekli (CRF)',
      FR: `Sabit Oranlı (FR-${s.ratioN})`,
      VR: `Değişken Oranlı (VR-${s.ratioN})`,
      FI: `Sabit Aralıklı (FI-${s.intervalS}sn)`,
      VI: `Değişken Aralıklı (VI-${s.intervalS}sn)`
    };

    await ctx.message(`<h3>Skinner (1938) – Edimsel Koşullanma Kutusu</h3>
      <p>Aktif Tarife: <b>${schedNames[sched]}</b></p>
      <p>Aşağıdaki <b>MANİVELAYA BAS</b> butonuna dokunarak veya <b>BOŞLUK</b> tuşuna basarak yem kazanmaya çalışın.</p>
      <p>Ekranda Skinner'ın icat ettiği <b>Kümülatif Kayıt Cihazı</b> canlı olarak çizilecektir.</p>`, 'Oturumu Başlat');

    let totalPresses = 0;
    let totalPellets = 0;
    let pressCounterInRatio = 0;
    let nextVRTarget = s.ratioN;
    let nextAvailableTime = 0;
    let leverPressedVisual = false;
    let pelletDispenseTime = 0;

    const pressHistory = []; // { t, cumulativePress, gotPellet }

    const checkPellet = (t) => {
      let givePellet = false;
      if (sched === 'CRF') {
        givePellet = true;
      } else if (sched === 'FR') {
        pressCounterInRatio++;
        if (pressCounterInRatio >= s.ratioN) {
          givePellet = true;
          pressCounterInRatio = 0;
        }
      } else if (sched === 'VR') {
        pressCounterInRatio++;
        if (pressCounterInRatio >= nextVRTarget) {
          givePellet = true;
          pressCounterInRatio = 0;
          // Yeni rastgele hedef (örn. 5 ortalamalı: 2 ile 8 arası)
          nextVRTarget = U.int(Math.max(1, s.ratioN - 3), s.ratioN + 4);
        }
      } else if (sched === 'FI') {
        if (t >= nextAvailableTime) {
          givePellet = true;
          nextAvailableTime = t + s.intervalS;
        }
      } else if (sched === 'VI') {
        if (t >= nextAvailableTime) {
          givePellet = true;
          nextAvailableTime = t + U.rand(s.intervalS * 0.5, s.intervalS * 1.5);
        }
      }
      return givePellet;
    };

    let curTime = 0;
    const handlePress = () => {
      totalPresses++;
      leverPressedVisual = true;
      setTimeout(() => { leverPressedVisual = false; }, 100);

      const gotPellet = checkPellet(curTime);
      if (gotPellet) {
        totalPellets++;
        pelletDispenseTime = curTime + 0.8;
        Lab.tone(1200, 0.15, 0.3, 'triangle');
      } else {
        Lab.tone(320, 0.05, 0.1, 'sine');
      }

      pressHistory.push({ t: curTime, cum: totalPresses, pellet: gotPellet });
      ctx.hud(`Tarife: <b>${schedNames[sched]}</b> · Toplam Basış: <b>${totalPresses}</b> · Kazanılan Yem: <b>${totalPellets}</b>`);
    };

    // Buton
    const leverBtn = U.el('button', { type: 'button', class: 'btn primary big', style: { minHeight: '64px', fontSize: '20px' } }, '⚡ MANİVELAYA BAS (BOŞLUK)');
    leverBtn.addEventListener('pointerdown', e => { e.preventDefault(); handlePress(); });
    leverBtn.addEventListener('click', () => { if (Lab.test) handlePress(); });
    ctx.setControls(leverBtn);

    ctx.on(window, 'keydown', e => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handlePress();
      }
    });

    const T = s.durationS;

    const drawSkinnerBox = (t) => {
      // Sol taraf: Skinner Kutusu (Animasyonlu)
      // Sağ taraf: Kümülatif Kayıt Cihazı (Kağıt rulosu grafiği)

      // Arka plan
      g.fillStyle = '#f1f5f9'; g.fillRect(0, 0, W, H);

      // KUTU BÖLÜMÜ (Sol yarı)
      const boxW = 220;
      g.fillStyle = '#e2e8f0'; g.fillRect(10, 10, boxW, H - 20);
      g.strokeStyle = '#334155'; g.lineWidth = 4; g.strokeRect(10, 10, boxW, H - 20);

      // Kutu zemin ızgarası (Grid floor)
      g.strokeStyle = '#94a3b8'; g.lineWidth = 2;
      for (let x = 16; x < boxW + 4; x += 14) {
        g.beginPath(); g.moveTo(x, H - 35); g.lineTo(x, H - 12); g.stroke();
      }

      // Uyarıcı Işık (Cue Light)
      const lightOn = sched !== 'FI' || (curTime >= nextAvailableTime);
      g.fillStyle = lightOn ? '#22c55e' : '#ef4444';
      g.beginPath(); g.arc(36, 40, 12, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#1e293b'; g.lineWidth = 2; g.stroke();

      // Manivela / Kaldıraç (Lever)
      const leverY = leverPressedVisual ? H * 0.52 : H * 0.48;
      g.fillStyle = '#475569';
      g.fillRect(boxW - 35, leverY, 40, 14);
      g.fillStyle = leverPressedVisual ? '#f59e0b' : '#94a3b8';
      g.beginPath(); g.arc(boxW - 35, leverY + 7, 10, 0, Math.PI * 2); g.fill();

      // Yem Hunisi ve Tabağı (Pellet dispenser)
      g.fillStyle = '#cbd5e1';
      g.fillRect(boxW - 55, H - 75, 45, 45);
      g.strokeStyle = '#475569'; g.lineWidth = 2; g.strokeRect(boxW - 55, H - 75, 45, 45);

      // Düşen / Alınan Yem (Pellet)
      if (t < pelletDispenseTime) {
        g.fillStyle = '#ea580c';
        g.beginPath(); g.arc(boxW - 32, H - 52, 9, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#16a34a';
        g.font = 'bold 12px system-ui';
        g.fillText('+1 YEM!', boxW - 55, H - 85);
      }

      // KÜMÜLATİF KAYIT CİHAZI (Sağ yarı)
      const recX = 245, recY = 35, recW = W - recX - 15, recH = H - 50;
      g.fillStyle = '#ffffff'; g.fillRect(recX, recY, recW, recH);
      g.strokeStyle = '#cbd5e1'; g.lineWidth = 2; g.strokeRect(recX, recY, recW, recH);

      // Başlık
      g.fillStyle = '#1e293b';
      g.font = 'bold 12px system-ui';
      g.fillText('KÜMÜLATİF KAYIT CİHAZI', recX + 10, recY - 8);

      // Zaman ızgarası
      g.strokeStyle = '#f1f5f9'; g.lineWidth = 1;
      for (let gx = recX + 30; gx < recX + recW; gx += 30) {
        g.beginPath(); g.moveTo(gx, recY); g.lineTo(gx, recY + recH); g.stroke();
      }

      // Kümülatif çizgi
      const maxCum = Math.max(25, totalPresses + 5);
      g.strokeStyle = '#4f46e5';
      g.lineWidth = 2.5;
      g.beginPath();

      let lastX = recX;
      let lastY = recY + recH;
      g.moveTo(lastX, lastY);

      pressHistory.forEach(p => {
        const px = recX + (p.t / T) * recW;
        const py = (recY + recH) - (p.cum / maxCum) * recH;
        g.lineTo(px, lastY); // Yatay ilerleme
        g.lineTo(px, py);    // Dikey basış adımı
        lastX = px;
        lastY = py;

        // Yem kazanıldığında Skinner çentiği (Tick mark)
        if (p.pellet) {
          g.stroke();
          g.save();
          g.strokeStyle = '#ef4444';
          g.lineWidth = 2;
          g.beginPath();
          g.moveTo(px, py);
          g.lineTo(px + 4, py + 8);
          g.stroke();
          g.restore();
          g.beginPath();
          g.moveTo(px, py);
        }
      });

      // Şimdiki zamana kadar uzat
      const nowX = recX + (t / T) * recW;
      g.lineTo(nowX, lastY);
      g.stroke();

      // Kalan süre
      g.fillStyle = '#64748b';
      g.font = '12px system-ui';
      g.fillText(`Kalan: ${Math.max(0, Math.ceil(T - t))} sn`, recX + recW - 80, recY + 16);
    };

    await ctx.animate((t, dt) => {
      curTime = t;
      drawSkinnerBox(t);
      return t >= T;
    });

    ctx.setControls();

    const ratePerMin = (totalPresses / (s.durationS / 60));

    const checks = [
      {
        ok: totalPresses >= 5 ? true : 'warn',
        label: `Toplam Basış Sayısı: ${totalPresses} (Dakikada ${U.fmt(ratePerMin, 1)} basış)`,
        detail: totalPresses >= 5 ? 'Manivela aktif olarak kullanıldı.' : 'Daha fazla basış yaparak tarifeyi test edin.'
      },
      {
        ok: totalPellets >= 1 ? true : 'warn',
        label: `Kazanılan Yem Sayısı: ${totalPellets}`,
        detail: totalPellets >= 1 ? 'Tarife kuralına ulaşılarak ödül alındı.' : 'Seçilen tarife koşulu sağlanamadı.'
      },
      {
        ok: true,
        label: `Aktif Tarife: ${schedNames[sched]}`,
        detail: sched === 'VR' 
          ? 'Değişken Oranlı (VR) tarifeler kumarda olduğu gibi en yüksek ve duraksız tepki hızını üretir.' 
          : sched === 'FR' 
          ? 'Sabit Oranlı (FR) tarifelerde her ödülden sonra kısa bir dinlenme (post-reinforcement pause) görülür.'
          : 'Aralıklı tarifelerde zamanlama davranışı belirler.'
      }
    ];

    const rows = [
      { metrik: 'Pekiştirme Tarifesi', değer: schedNames[sched] },
      { metrik: 'Toplam Manivela Basışı', değer: totalPresses },
      { metrik: 'Kazanılan Yem Sayısı', değer: totalPellets },
      { metrik: 'Tepki Hızı (Basış/Dk)', değer: U.fmt(ratePerMin, 1) },
      { metrik: 'Oturum Süresi (sn)', değer: s.durationS }
    ];

    return {
      summary: [
        { label: 'Pekiştirme Tarifesi', value: sched },
        { label: 'Toplam Basış', value: String(totalPresses) },
        { label: 'Kazanılan Yem', value: String(totalPellets) },
        { label: 'Basış Hızı', value: `${U.fmt(ratePerMin, 0)}/dk` }
      ],
      checks,
      charts: [
        {
          title: 'Skinner Kümülatif Kayıt Grafiği (Zamana Göre Toplam Basış)',
          svg: U.svgLine({
            series: [{
              name: 'Kümülatif Basış',
              pts: pressHistory.map(p => [p.t, p.cum]),
              color: '#4f46e5'
            }],
            xmin: 0,
            xmax: s.durationS,
            ymin: 0,
            ymax: Math.max(10, totalPresses * 1.15),
            xlabel: 'Süre (sn)',
            ylabel: 'Kümülatif Basış'
          })
        }
      ],
      interpretation: `<p>B. F. Skinner (1938), canlıların sadece pasif uyaranlara tepki vermediğini (Pavlov'un aksine), çevre üzerinde aktif olarak işlem yaparak (<b>edim / operant</b>) sonuçlarına göre davranışlarını şekillendirdiğini gösterdi.</p>
      <p>Bu oturumda <b>${schedNames[sched]}</b> tarifesini test ettiniz. Kümülatif kayıt grafiğindeki eğimin dikliği tepki hızını, kırmızı çentikler ise pekiştirilen anları gösterir. Özellikle <b>VR (Değişken Oran)</b> tarifesi, kumar bağımlılıklarında da görüldüğü gibi en inatçı ve yoğun davranışı üreten mekanizmadır.</p>`,
      trials: rows
    };
  }
});
})();
