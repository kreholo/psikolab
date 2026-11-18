(function () {
'use strict';
const U = Lab.u;

// Rensink sahneleri: Orijinal (A) ve Değiştirilmiş (A') çizim fonksiyonları
const SCENES = [
  {
    id: 'harbor',
    name: 'Liman ve Tekneler (Merkez İlgi)',
    type: 'central',
    changeDesc: 'Büyük teknenin yelkeni kaybolup geri geliyor',
    targetRect: { x: 260, y: 80, w: 100, h: 140 },
    draw(g, W, H, isChanged) {
      // Gökyüzü ve deniz
      g.fillStyle = '#bae6fd'; g.fillRect(0, 0, W, H * 0.6);
      g.fillStyle = '#0284c7'; g.fillRect(0, H * 0.6, W, H * 0.4);
      // Güneş ve bulutlar
      g.fillStyle = '#fde047'; g.beginPath(); g.arc(70, 60, 30, 0, Math.PI * 2); g.fill();
      // İskele
      g.fillStyle = '#78350f'; g.fillRect(0, H * 0.65, 180, 20);
      g.fillStyle = '#451a03'; for (let x = 20; x < 180; x += 30) g.fillRect(x, H * 0.65, 10, 60);
      // Küçük tekne
      g.fillStyle = '#dc2626'; g.beginPath(); g.moveTo(80, H * 0.68); g.lineTo(140, H * 0.68); g.lineTo(125, H * 0.74); g.lineTo(95, H * 0.74); g.fill();
      // BÜYÜK TEKNE (Merkez)
      const bx = 300, by = H * 0.65;
      g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(bx - 60, by); g.lineTo(bx + 70, by); g.lineTo(bx + 50, by + 30); g.lineTo(bx - 40, by + 30); g.fill();
      g.strokeStyle = '#334155'; g.lineWidth = 4; g.beginPath(); g.moveTo(bx, by); g.lineTo(bx, by - 120); g.stroke();
      // YELKEN (Değişen parça!)
      if (!isChanged) {
        g.fillStyle = '#ef4444';
        g.beginPath();
        g.moveTo(bx + 4, by - 110);
        g.lineTo(bx + 55, by - 20);
        g.lineTo(bx + 4, by - 20);
        g.fill();
      }
    }
  },
  {
    id: 'park',
    name: 'Şehir Parkı (Marjinal / Kenar İlgi)',
    type: 'marginal',
    changeDesc: 'Uzak arka plandaki binanın bacası / kulesi',
    targetRect: { x: 410, y: 50, w: 50, h: 80 },
    draw(g, W, H, isChanged) {
      // Arka plan binaları
      g.fillStyle = '#e2e8f0'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#94a3b8'; g.fillRect(60, 80, 80, H * 0.5);
      g.fillStyle = '#64748b'; g.fillRect(200, 60, 100, H * 0.55);
      g.fillStyle = '#475569'; g.fillRect(380, 100, 90, H * 0.5);
      // DEĞİŞEN BACANIN KULESİ (Uzak kenar detay)
      if (!isChanged) {
        g.fillStyle = '#dc2626';
        g.fillRect(425, 60, 20, 40);
        g.beginPath(); g.moveTo(415, 60); g.lineTo(435, 35); g.lineTo(455, 60); g.fill();
      }
      // Ön plandaki büyük ağaç ve çimler (Merkez ilgi çeldiricisi)
      g.fillStyle = '#22c55e'; g.fillRect(0, H * 0.55, W, H * 0.45);
      g.fillStyle = '#78350f'; g.fillRect(140, H * 0.45, 30, 90);
      g.fillStyle = '#15803d'; g.beginPath(); g.arc(155, H * 0.4, 65, 0, Math.PI * 2); g.fill();
      // Bank
      g.fillStyle = '#b45309'; g.fillRect(270, H * 0.68, 70, 16);
      g.fillStyle = '#78350f'; g.fillRect(280, H * 0.72, 8, 25); g.fillRect(322, H * 0.72, 8, 25);
    }
  },
  {
    id: 'livingroom',
    name: 'Oturma Odası (Merkez İlgi)',
    type: 'central',
    changeDesc: 'Sehpanın üzerindeki vazo kayboluyor',
    targetRect: { x: 230, y: 190, w: 60, h: 70 },
    draw(g, W, H, isChanged) {
      // Duvar ve zemin
      g.fillStyle = '#fef3c7'; g.fillRect(0, 0, W, H * 0.7);
      g.fillStyle = '#d97706'; g.fillRect(0, H * 0.7, W, H * 0.3);
      // Tablo
      g.fillStyle = '#3b82f6'; g.fillRect(60, 50, 100, 70);
      g.strokeStyle = '#78350f'; g.lineWidth = 6; g.strokeRect(60, 50, 100, 70);
      // Koltuk
      g.fillStyle = '#4f46e5';
      g.beginPath(); g.roundRect ? g.roundRect(80, H * 0.55, 140, 90, 12) : g.rect(80, H * 0.55, 140, 90); g.fill();
      // Sehpa
      g.fillStyle = '#a16207'; g.fillRect(210, H * 0.68, 120, 24);
      g.fillStyle = '#713f12'; g.fillRect(225, H * 0.73, 10, 35); g.fillRect(305, H * 0.73, 10, 35);
      // VAZO VE ÇİÇEK (Değişen merkez parça)
      if (!isChanged) {
        g.fillStyle = '#06b6d4';
        g.beginPath(); g.arc(260, H * 0.64, 14, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#ec4899';
        g.beginPath(); g.arc(260, H * 0.58, 8, 0, Math.PI * 2); g.fill();
      }
    }
  },
  {
    id: 'road',
    name: 'Kır Yolu ve Çitler (Marjinal / Kenar İlgi)',
    type: 'marginal',
    changeDesc: 'Sol köşedeki çit direğinin boyu',
    targetRect: { x: 10, y: 170, w: 40, h: 80 },
    draw(g, W, H, isChanged) {
      // Gökyüzü ve tepeler
      g.fillStyle = '#bae6fd'; g.fillRect(0, 0, W, H * 0.5);
      g.fillStyle = '#86efac'; g.beginPath(); g.arc(200, H * 0.7, 260, Math.PI, Math.PI * 2); g.fill();
      // Yol
      g.fillStyle = '#cbd5e1';
      g.beginPath(); g.moveTo(W * 0.45, H * 0.5); g.lineTo(W * 0.55, H * 0.5); g.lineTo(W * 0.8, H); g.lineTo(W * 0.2, H); g.fill();
      // ÇİT DİREĞİ (Değişen marjinal detay)
      g.fillStyle = '#78350f';
      const postH = isChanged ? 40 : 95;
      g.fillRect(20, H * 0.65 - postH + 40, 14, postH);
      // Diğer çitler
      g.fillRect(60, H * 0.65 - 10, 14, 50);
      g.fillRect(100, H * 0.65 - 20, 14, 60);
      g.strokeStyle = '#92400e'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(20, H * 0.65); g.lineTo(120, H * 0.65); g.stroke();
    }
  }
];

Lab.register({
  id: 'rensink', icon: '⚡', short: 'Rensink Değişim', title: 'Rensink ve ark. (1997) – Kırpışma (Flicker) Paradigması', group: 'Seçici dikkat / Körlük',
  tagline: 'Araya giren gri bir flaş, devasa değişiklikleri görmemizi nasıl engeller?',
  about: `<p><b>Ronald Rensink, Kevin O'Regan ve James Clark (1997)</b>, görsel algıda çığır açan <b>Kırpışma (Flicker) Paradigmasını</b> geliştirdi.</p>
  <p>Normalde bir resimde bir şey değiştiğinde retinamızdaki <i>hareket algılayıcılar</i> otomatik olarak gözümüzü oraya çeker. Ancak iki resim arasına çok kısa (80 ms) <b>boş gri bir ekran (kırpışma)</b> konulduğunda, tüm ekranda genel bir görsel gürültü oluşur ve beynin yerel hareket algısı felç olur!</p>
  <p>Sonuç olarak kişi sahneyi büyüteçle arar gibi <b>odaklanmış dikkatle</b> parça parça taramak zorunda kalır. Merkezdeki önemli ögeler (Merkez İlgi) nispeten çabuk bulunurken, kenar detaylardaki (Marjinal İlgi) değişiklikleri bulmak onlarca saniye sürebilir veya hiç fark edilemez.</p>`,
  howto: `<ol>
  <li>Ekranda iki resim aralarında kısa bir gri flaş ile döngü halinde yanıp sönecektir (Resim A → Gri Ekran → Resim A' → Gri Ekran).</li>
  <li>Resimdeki <b>değişen ögeyi</b> bulduğunuz an hemen <b>BOŞLUK</b> tuşuna veya aşağıdaki <b>BULDUM!</b> butonuna basın.</li>
  <li>Ardından ekranda değiştiğini gördüğünüz yerin üzerine dokunun/tıklayın.</li>
  </ol>`,
  verify: `<ul>
  <li>Tepki süresi ve değişim döngü sayısı (alternations) kaydedilir.</li>
  <li>Tıklanan yerin gerçek değişim alanıyla örtüşüp örtüşmediği denetlenir.</li>
  <li>Merkez İlgi ile Marjinal İlgi arasındaki tespit süresi farkı kontrol edilir.</li>
  </ul>`,
  refs: 'Rensink, R. A., O\'Regan, J. K., & Clark, J. J. (1997). To see or not to see: The need for attention to perceive changes in scenes. Psychol. Sci., 8(5), 368–373.',
  settings: [
    { group: 'Zamanlama' },
    { key: 'imgMs', label: 'Resim gösterim süresi', type: 'number', def: 240, min: 100, max: 800, step: 20, unit: 'ms' },
    { key: 'blankMs', label: 'Gri kırpışma (blank) süresi', type: 'number', def: 80, min: 0, max: 300, step: 10, unit: 'ms', help: '0 ms = Kırpışmasız (hareket uyarılı) kontrol' },
    { key: 'timeoutS', label: 'Maksimum arama süresi', type: 'number', def: 30, min: 10, max: 90, step: 5, unit: 'sn' },
    { group: 'Kapsam' },
    { key: 'scenesCount', label: 'Sahne sayısı', type: 'number', def: 4, min: 2, max: 4 }
  ],
  testSettings: { imgMs: 40, blankMs: 20, timeoutS: 5, scenesCount: 2 },
  unit() {
    return [
      ['Rensink sahneleri tanımlı', SCENES.length >= 4],
      ['Hem merkez hem marjinal sahneler var', SCENES.some(s => s.type === 'central') && SCENES.some(s => s.type === 'marginal')]
    ];
  },
  async run(ctx) {
    const s = ctx.s;
    const W = 500, H = 340;
    const C = ctx.canvas(W, H, { maxWidth: 520 });
    const g = C.g;

    await ctx.message(`<h3>Rensink ve ark. (1997) – Kırpışma Testi</h3>
      <p>Resimler arasında gri bir flaş yanıp sönerken sahnedeki <b>SÜREKLİ DEĞİŞEN BİR PARÇAYI</b> bulmaya çalışacaksınız.</p>
      <p>Değişimi fark ettiğiniz anda hemen <b>BULDUM!</b> butonuna veya <b>BOŞLUK</b> tuşuna basın.</p>
      <p>Sonrasında değişimin yerini fareyle/parmağınızla işaretleyeceksiniz.</p>`, 'Başla');

    const scenesToRun = SCENES.slice(0, s.scenesCount);
    const rows = [];

    for (let scIdx = 0; scIdx < scenesToRun.length; scIdx++) {
      const sc = scenesToRun[scIdx];
      ctx.hud(`Sahne ${scIdx + 1} / ${scenesToRun.length}: ${sc.name}`);

      let found = false;
      let foundTime = null;
      let cycles = 0;
      const tStart = performance.now();

      // Buton
      const foundBtn = U.el('button', { type: 'button', class: 'btn primary big', 'aria-label': 'Buldum' }, '👁️ DEĞİŞİMİ BULDUM!');
      const triggerFound = () => {
        if (!found) {
          found = true;
          foundTime = performance.now() - tStart;
        }
      };
      foundBtn.addEventListener('click', triggerFound);
      ctx.setControls(foundBtn);
      ctx.on(window, 'keydown', e => { if (e.key === ' ' || e.key === 'Enter') triggerFound(); });

      // Bot için otomatik tespit
      if (Lab.test) {
        setTimeout(triggerFound, sc.type === 'central' ? 120 : 250);
      }

      // Kırpışma animasyon döngüsü
      while (!found && (performance.now() - tStart) < s.timeoutS * 1000) {
        cycles++;
        // 1. Resim A
        sc.draw(g, W, H, false);
        await ctx.wait(s.imgMs);
        if (found) break;

        // 2. Gri Maske
        if (s.blankMs > 0) {
          g.fillStyle = '#64748b';
          g.fillRect(0, 0, W, H);
          await ctx.wait(s.blankMs);
          if (found) break;
        }

        // 3. Resim A' (Değiştirilmiş)
        sc.draw(g, W, H, true);
        await ctx.wait(s.imgMs);
        if (found) break;

        // 4. Gri Maske
        if (s.blankMs > 0) {
          g.fillStyle = '#64748b';
          g.fillRect(0, 0, W, H);
          await ctx.wait(s.blankMs);
        }
      }

      ctx.setControls();

      let clickSuccess = false;
      let clickCoord = { x: 0, y: 0 };

      if (found) {
        // Doğrulama tıklaması: Nerede gördünüz?
        sc.draw(g, W, H, false);
        ctx.hud('<b>Harika!</b> Şimdi değiştiğini gördüğünüz yerin üzerine tıklayın/dokunun:');

        const clickEv = await ctx.waitTap({ target: C.cv });
        const pt = C.pt(clickEv);
        clickCoord = pt;

        const tr = sc.targetRect;
        // Tıklama hedef kutusunun toleranslı çevresi içinde mi?
        const tol = 30;
        clickSuccess = (pt.x >= tr.x - tol && pt.x <= tr.x + tr.w + tol && pt.y >= tr.y - tol && pt.y <= tr.y + tr.h + tol);

        // Hedef alanını yeşil/kırmızı kutuyla göster
        g.strokeStyle = clickSuccess ? '#22c55e' : '#ef4444';
        g.lineWidth = 4;
        g.strokeRect(tr.x, tr.y, tr.w, tr.h);
        g.fillStyle = clickSuccess ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)';
        g.fillRect(tr.x, tr.y, tr.w, tr.h);

        // Kullanıcının tıkladığı nokta
        g.fillStyle = '#3b82f6';
        g.beginPath(); g.arc(pt.x, pt.y, 8, 0, Math.PI * 2); g.fill();

        ctx.hud(clickSuccess ? '<b style="color:#16a34a">✔ Doğru bölgeyi buldunuz!</b>' : '<b style="color:#ef4444">✘ Değişim işaretli kutudaydı.</b>');
        await ctx.sleep(Lab.test ? 30 : 1200);
      } else {
        ctx.hud('<b style="color:#ef4444">Süre doldu, değişim bulunamadı.</b>');
        await ctx.sleep(Lab.test ? 30 : 1000);
      }

      rows.push({
        sahne: sc.name,
        ilgi_tipi: sc.type === 'central' ? 'Merkez İlgi' : 'Marjinal (Kenar)',
        bulundu_mu: (found && clickSuccess) ? 'Evet (Doğrulandı)' : found ? 'Tıklama yanlış' : 'Bulunamadı',
        süre_ms: found ? Math.round(foundTime) : Math.round(s.timeoutS * 1000),
        döngü_sayısı: cycles,
        değişim_açıklaması: sc.changeDesc
      });

      ctx.progress(scIdx + 1, scenesToRun.length);
    }

    const centralRows = rows.filter(r => r.ilgi_tipi === 'Merkez İlgi');
    const marginalRows = rows.filter(r => r.ilgi_tipi === 'Marjinal (Kenar)');

    const meanCentralRT = U.mean(centralRows.map(r => r.süre_ms));
    const meanMarginalRT = U.mean(marginalRows.map(r => r.süre_ms));

    const checks = [
      {
        ok: rows.some(r => r.bulundu_mu.includes('Evet')) ? true : 'warn',
        label: `Tespit Edilen Sahneler: ${rows.filter(r => r.bulundu_mu.includes('Evet')).length} / ${rows.length}`,
        detail: 'Kırpışma altında en az bir sahneyi başarıyla tespit ettiniz.'
      },
      {
        ok: true,
        label: `Merkez vs Marjinal Süre: Merkez = ${U.ms(meanCentralRT)}, Marjinal = ${U.ms(meanMarginalRT)}`,
        detail: meanMarginalRT > meanCentralRT
          ? 'Rensink ve ark. (1997) ile uyumlu: Marjinal/kenar detaylardaki değişimleri bulmak çok daha uzun sürdü!'
          : 'Merkez ve kenar arama süreleri yakın gerçekleşti.'
      }
    ];

    return {
      summary: [
        { label: 'Merkez İlgi Ortalama Süre', value: U.ms(meanCentralRT) },
        { label: 'Marjinal İlgi Ortalama Süre', value: U.ms(meanMarginalRT) },
        { label: 'Kırpışma Süresi (Flicker)', value: s.blankMs + ' ms' }
      ],
      checks,
      charts: [
        {
          title: 'İlgi Türüne Göre Değişimi Bulma Süresi (ms)',
          svg: U.svgBars({
            labels: ['Merkez İlgi', 'Marjinal İlgi'],
            values: [meanCentralRT, meanMarginalRT],
            colors: ['#4f46e5', '#f59e0b'],
            unit: 'ms'
          })
        }
      ],
      interpretation: `<p>Rensink ve ark. (1997), araya giren 80 milisaniyelik gri bir ekranın tüm görsel alandaki yerel hareket ipuçlarını maskelediğini ve bu nedenle beynin görüntüyü parça parça <b>fokal dikkat</b> ile taramak zorunda kaldığını kanıtlamıştır.</p>
      <p>Bu deneyde Merkez İlgi değişikliklerini ortalama <b>${U.ms(meanCentralRT)}</b>, Marjinal detayları ise <b>${U.ms(meanMarginalRT)}</b> sürede buldunuz. Araya gri kırpışma konulmadığında ise (ayarlardan 0 ms yapabilirsiniz) göz hareket sinyallerini hemen yakalar ve değişim anında 'fırlar' (pop-out).</p>`,
      trials: rows
    };
  }
});
})();
